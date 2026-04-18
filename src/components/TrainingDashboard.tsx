'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Employee, branches } from '@/data/mockData';
import { CurrentUser } from '@/data/auth';
import {
  TrainingLegacy,
  TrainingRecord,
  fetchAllLegacy,
  fetchAllRecords,
  saveLegacy,
  deleteLegacy,
  subscribeToTraining,
} from '@/lib/trainingApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser | null;
  employees: Employee[];
}

interface Aggregated {
  manager_name: string;
  branch_code: string;
  branch_name: string;
  role: string;
  // 과거 누적
  legacy_m1: number; legacy_m2: number; legacy_m3: number; legacy_m4: number;
  legacy_a1: number; legacy_a2: number;
  // 5월부터 월별 합산
  rec_m1: number; rec_m2: number; rec_m3: number; rec_m4: number;
  rec_a1: number; rec_a2: number;
  // 전체 합
  total_m1: number; total_m2: number; total_m3: number; total_m4: number;
  total_a1: number; total_a2: number;
  main_total: number; // M1+M2+M3+M4
}

export default function TrainingDashboard({ isOpen, onClose, currentUser, employees }: Props) {
  const [legacy, setLegacy] = useState<TrainingLegacy[]>([]);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name'|'branch'|'total'>('total');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState<Partial<TrainingLegacy>>({});
  const [loading, setLoading] = useState(true);

  const isMaster = currentUser?.role === 'master';

  const loadAll = async () => {
    setLoading(true);
    const [leg, rec] = await Promise.all([fetchAllLegacy(), fetchAllRecords()]);
    setLegacy(leg);
    setRecords(rec);
    setLoading(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    loadAll();
    const unsub = subscribeToTraining(() => loadAll());
    return unsub;
  }, [isOpen]);

  const aggregated: Aggregated[] = useMemo(() => {
    // 매니저 이름 기준 (lowercase 매칭)
    const legMap: Record<string, TrainingLegacy> = {};
    for (const l of legacy) legMap[l.manager_name.toLowerCase()] = l;

    const recMap: Record<string, {m1:number;m2:number;m3:number;m4:number;a1:number;a2:number}> = {};
    for (const r of records) {
      const k = r.manager_name.toLowerCase();
      if (!recMap[k]) recMap[k] = {m1:0,m2:0,m3:0,m4:0,a1:0,a2:0};
      if (r.m1) recMap[k].m1++;
      if (r.m2) recMap[k].m2++;
      if (r.m3) recMap[k].m3++;
      if (r.m4) recMap[k].m4++;
      if (r.a1) recMap[k].a1++;
      if (r.a2) recMap[k].a2++;
    }

    // 모든 이름 수집 (대소문자 구분 없이 Key 통합)
    // key = lowercase, value = 표시용 이름 (대문자 우선)
    const nameMap: Record<string, string> = {};
    const pick = (name: string) => {
      const k = name.toLowerCase().trim();
      if (!k) return;
      const existing = nameMap[k];
      // 대문자로 시작하는 이름 우선 (Teri > teri)
      if (!existing || (name[0] >= 'A' && name[0] <= 'Z' && !(existing[0] >= 'A' && existing[0] <= 'Z'))) {
        nameMap[k] = name.trim();
      }
      // 현재 employees에 있는 이름이면 최우선
      if (employees.some(e => e.name.trim() === name.trim())) {
        nameMap[k] = name.trim();
      }
    };
    for (const l of legacy) pick(l.manager_name);
    for (const r of records) pick(r.manager_name);
    for (const e of employees) if (e.name.trim()) pick(e.name);

    const out: Aggregated[] = [];
    for (const [k, name] of Object.entries(nameMap)) {
      const leg = legMap[k] || {m1:0,m2:0,m3:0,m4:0,a1:0,a2:0};
      const rec = recMap[k] || {m1:0,m2:0,m3:0,m4:0,a1:0,a2:0};
      const emp = employees.find(e => e.name.toLowerCase().trim() === k);
      const br = emp ? branches.find(b => b.code === emp.code) : null;

      const total_m1 = leg.m1 + rec.m1;
      const total_m2 = leg.m2 + rec.m2;
      const total_m3 = leg.m3 + rec.m3;
      const total_m4 = leg.m4 + rec.m4;
      const total_a1 = leg.a1 + rec.a1;
      const total_a2 = leg.a2 + rec.a2;

      out.push({
        manager_name: name,
        branch_code: emp?.code || '-',
        branch_name: br?.name || '퇴사/미배정',
        role: emp?.role || '-',
        legacy_m1: leg.m1, legacy_m2: leg.m2, legacy_m3: leg.m3, legacy_m4: leg.m4,
        legacy_a1: leg.a1, legacy_a2: leg.a2,
        rec_m1: rec.m1, rec_m2: rec.m2, rec_m3: rec.m3, rec_m4: rec.m4,
        rec_a1: rec.a1, rec_a2: rec.a2,
        total_m1, total_m2, total_m3, total_m4, total_a1, total_a2,
        main_total: total_m1 + total_m2 + total_m3 + total_m4,
      });
    }
    return out;
  }, [legacy, records, employees]);

  const filtered = useMemo(() => {
    let rows = aggregated;
    if (filterBranch !== 'all') rows = rows.filter(r => r.branch_code === filterBranch);
    if (sortBy === 'name') rows = [...rows].sort((a, b) => a.manager_name.localeCompare(b.manager_name));
    else if (sortBy === 'branch') rows = [...rows].sort((a, b) => a.branch_code.localeCompare(b.branch_code) || a.manager_name.localeCompare(b.manager_name));
    else rows = [...rows].sort((a, b) => b.main_total - a.main_total);
    return rows;
  }, [aggregated, filterBranch, sortBy]);

  const summary = useMemo(() => {
    const total = filtered.length;
    const avg = total > 0 ? filtered.reduce((s, r) => s + r.main_total, 0) / total : 0;
    const m4Done = filtered.filter(r => r.total_m4 >= 6).length;
    const complete = filtered.filter(r => r.total_m1 > 0 && r.total_m2 > 0 && r.total_m3 > 0 && r.total_m4 > 0).length;
    return { total, avg, m4Done, complete };
  }, [filtered]);

  const startEdit = (row: Aggregated) => {
    if (!isMaster) return;
    setEditingName(row.manager_name);
    setEditBuf({
      manager_name: row.manager_name,
      m1: row.legacy_m1, m2: row.legacy_m2, m3: row.legacy_m3, m4: row.legacy_m4,
      a1: row.legacy_a1, a2: row.legacy_a2,
    });
  };

  const saveEdit = async () => {
    if (!editBuf.manager_name) return;
    const ok = await saveLegacy({
      manager_name: editBuf.manager_name,
      m1: Number(editBuf.m1) || 0,
      m2: Number(editBuf.m2) || 0,
      m3: Number(editBuf.m3) || 0,
      m4: Number(editBuf.m4) || 0,
      a1: Number(editBuf.a1) || 0,
      a2: Number(editBuf.a2) || 0,
    });
    if (ok) {
      setEditingName(null);
      setEditBuf({});
      loadAll();
    } else {
      alert('저장 실패!');
    }
  };

  const handleDelete = async (name: string) => {
    if (!isMaster) return;
    if (!confirm(`${name}의 과거 누적 데이터를 삭제합니까? (월별 기록은 유지됩니다)`)) return;
    const ok = await deleteLegacy(name);
    if (ok) loadAll();
  };

  const handleAdd = async () => {
    if (!isMaster) return;
    const name = prompt('추가할 매니저 이름 (영문/한글)');
    if (!name || !name.trim()) return;
    const ok = await saveLegacy({ manager_name: name.trim(), m1:0,m2:0,m3:0,m4:0,a1:0,a2:0 });
    if (ok) loadAll();
  };

  const downloadExcel = () => {
    // CSV 다운로드 (엑셀에서 바로 열림, UTF-8 BOM 포함)
    const headers = ['지점코드','지점명','이름','직책','M1','M2','M3','M4','주직군총합','A1','A2'];
    const rows = filtered.map(r => [
      r.branch_code, r.branch_name, r.manager_name, r.role,
      r.total_m1, r.total_m2, r.total_m3, r.total_m4, r.main_total,
      r.total_a1, r.total_a2,
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date();
    a.download = `직군이수_${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg md:text-xl font-bold text-gray-800">💪 직군 이수 대시보드</h2>
            <span className="text-xs text-gray-500">과거 누적 + 2026.05~ 월별 합산</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Summary + Filters */}
        <div className="px-4 md:px-6 py-2 md:py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center gap-2 md:gap-3">
          <div className="flex gap-2 flex-wrap text-xs md:text-sm">
            <span className="px-2 py-1 bg-white rounded border border-gray-200">전체 <b>{summary.total}</b>명</span>
            <span className="px-2 py-1 bg-white rounded border border-gray-200">평균 <b>{summary.avg.toFixed(1)}</b>개월</span>
            <span className="px-2 py-1 bg-white rounded border border-gray-200">4대 직군 완주 <b className="text-green-600">{summary.complete}</b>명</span>
            <span className="px-2 py-1 bg-white rounded border border-gray-200">M4 6개월+ <b className="text-blue-600">{summary.m4Done}</b>명</span>
          </div>
          <div className="ml-auto flex gap-2 flex-wrap">
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="text-xs md:text-sm px-2 py-1 border border-gray-300 rounded">
              <option value="all">전체 지점</option>
              {branches.map(b => <option key={b.code} value={b.code}>{b.code}_{b.name}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="text-xs md:text-sm px-2 py-1 border border-gray-300 rounded">
              <option value="total">총합 높은순</option>
              <option value="name">이름순</option>
              <option value="branch">지점순</option>
            </select>
            {isMaster && (
              <>
                <button onClick={downloadExcel} className="text-xs md:text-sm px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-500">📥 엑셀</button>
                <button onClick={handleAdd} className="text-xs md:text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500">+ 추가</button>
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-2 md:px-4 py-2">
          {loading ? (
            <div className="text-center text-gray-400 py-8">로딩 중...</div>
          ) : (
            <table className="w-full text-xs md:text-sm border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr>
                  <th className="border border-gray-200 px-2 py-1.5 bg-gray-100 text-left">지점</th>
                  <th className="border border-gray-200 px-2 py-1.5 bg-gray-100 text-left">이름</th>
                  <th className="border border-gray-200 px-2 py-1.5 bg-gray-100">직책</th>
                  <th className="border border-gray-200 px-1 py-1.5 bg-blue-50 text-blue-700">M1</th>
                  <th className="border border-gray-200 px-1 py-1.5 bg-blue-50 text-blue-700">M2</th>
                  <th className="border border-gray-200 px-1 py-1.5 bg-blue-50 text-blue-700">M3</th>
                  <th className="border border-gray-200 px-1 py-1.5 bg-blue-50 text-blue-700">M4</th>
                  <th className="border-l-2 border-gray-400 border-y border-r border-gray-200 px-2 py-1.5 bg-indigo-100 text-indigo-800">주직군 총합</th>
                  <th className="border-l-2 border-gray-400 border-y border-r border-gray-200 px-1 py-1.5 bg-purple-50 text-purple-700">A1</th>
                  <th className="border border-gray-200 px-1 py-1.5 bg-purple-50 text-purple-700">A2</th>
                  {isMaster && <th className="border border-gray-200 px-2 py-1.5 bg-gray-100">편집</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const isEditing = editingName === r.manager_name;
                  return (
                    <tr key={r.manager_name} className="hover:bg-yellow-50">
                      <td className="border border-gray-200 px-2 py-1 text-gray-600">
                        <span className="text-gray-400 mr-1">{r.branch_code}</span>{r.branch_name}
                      </td>
                      <td className="border border-gray-200 px-2 py-1 font-medium">
                        {r.manager_name}
                        {r.rec_m1+r.rec_m2+r.rec_m3+r.rec_m4 > 0 && (
                          <span className="ml-1 text-[9px] text-green-600 bg-green-50 px-1 rounded">+{r.rec_m1+r.rec_m2+r.rec_m3+r.rec_m4}</span>
                        )}
                      </td>
                      <td className="border border-gray-200 px-2 py-1 text-center text-gray-500 text-[10px]">{r.role}</td>
                      {(['m1','m2','m3','m4'] as const).map(k => (
                        <td key={k} className="border border-gray-200 px-1 py-0.5 text-center">
                          {isEditing ? (
                            <input type="number" min="0" value={(editBuf as any)[k] ?? 0} onChange={e => setEditBuf(b => ({...b, [k]: Number(e.target.value)}))} className="w-10 text-xs px-1 border border-indigo-300 rounded" />
                          ) : (
                            <span className={(r as any)[`total_${k}`] > 0 ? 'text-blue-700 font-medium' : 'text-gray-300'}>
                              {(r as any)[`total_${k}`]}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="border-l-2 border-gray-400 border-y border-r border-gray-200 px-2 py-1 text-center bg-indigo-50 font-bold text-indigo-800">
                        {r.main_total}
                      </td>
                      {(['a1','a2'] as const).map((k, idx) => (
                        <td key={k} className={`${idx === 0 ? 'border-l-2 border-gray-400 border-y border-r' : 'border'} border-gray-200 px-1 py-0.5 text-center`}>
                          {isEditing ? (
                            <input type="number" min="0" value={(editBuf as any)[k] ?? 0} onChange={e => setEditBuf(b => ({...b, [k]: Number(e.target.value)}))} className="w-10 text-xs px-1 border border-purple-300 rounded" />
                          ) : (
                            <span className={(r as any)[`total_${k}`] > 0 ? 'text-purple-700 font-medium' : 'text-gray-300'}>
                              {(r as any)[`total_${k}`]}
                            </span>
                          )}
                        </td>
                      ))}
                      {isMaster && (
                        <td className="border border-gray-200 px-2 py-1 text-center whitespace-nowrap">
                          {isEditing ? (
                            <>
                              <button onClick={saveEdit} className="text-[10px] px-2 py-0.5 bg-green-600 text-white rounded mr-1">저장</button>
                              <button onClick={() => setEditingName(null)} className="text-[10px] px-2 py-0.5 bg-gray-400 text-white rounded">취소</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(r)} className="text-[10px] text-blue-600 hover:underline mr-2">수정</button>
                              <button onClick={() => handleDelete(r.manager_name)} className="text-[10px] text-red-500 hover:underline">삭제</button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-4 md:px-6 py-2 border-t border-gray-100 text-[10px] md:text-xs text-gray-400 flex flex-wrap gap-2">
          <span>💡 숫자 = 과거 누적(구글시트) + 2026.5월부터 월별 체크 합산</span>
          <span>· 초록 뱃지(+N) = 5월 이후 추가분</span>
          {isMaster && <span>· 마스터만 편집/삭제 가능</span>}
        </div>
      </div>
    </div>
  );
}
