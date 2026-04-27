'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Employee, branches } from '@/data/mockData';
import { resolveEmpInfo } from '@/data/amaranth';
import {
  TrainingRecord,
  TrainingLegacy,
  fetchAllRecords,
  fetchAllLegacy,
  subscribeToTraining,
} from '@/lib/trainingApi';
import { supabase } from '@/lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  defaultMonth: number;
  year: number;
}

type Milestone = 'm1' | 'm2' | 'm3' | 'm4' | 'a1' | 'a2';
const MILESTONES: Milestone[] = ['m1', 'm2', 'm3', 'm4', 'a1', 'a2'];
const MILESTONE_LABEL: Record<Milestone, string> = {
  m1: 'M1', m2: 'M2', m3: 'M3', m4: 'M4', a1: 'A1', a2: 'A2',
};
const MILESTONE_COLOR: Record<Milestone, string> = {
  m1: 'border-blue-200',
  m2: 'border-green-200',
  m3: 'border-amber-200',
  m4: 'border-rose-200',
  a1: 'border-purple-200',
  a2: 'border-indigo-200',
};
const MILESTONE_HEAD: Record<Milestone, string> = {
  m1: 'bg-blue-50 text-blue-700',
  m2: 'bg-green-50 text-green-700',
  m3: 'bg-amber-50 text-amber-700',
  m4: 'bg-rose-50 text-rose-700',
  a1: 'bg-purple-50 text-purple-700',
  a2: 'bg-indigo-50 text-indigo-700',
};

type ViewMode = 'monthly' | 'cumulative';

export default function MonthlyRosterModal({ isOpen, onClose, employees, defaultMonth, year }: Props) {
  const [month, setMonth] = useState(defaultMonth);
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [legacy, setLegacy] = useState<TrainingLegacy[]>([]);
  const [loading, setLoading] = useState(true);

  // 모달 열릴 때 기본값 (records 로드 후 보정됨)
  useEffect(() => { if (isOpen) setMonth(defaultMonth); }, [isOpen, defaultMonth]);

  // records 로드 직후, 선택한 월에 데이터 없고 다른 월엔 있으면 가장 최근 데이터 있는 월로 자동 이동
  const [autoSwitched, setAutoSwitched] = useState(false);
  useEffect(() => {
    if (!isOpen) { setAutoSwitched(false); return; }
    if (autoSwitched || loading) return;
    const monthsWithData = Array.from(new Set(
      records.filter(r => r.year === year && (r.m1||r.m2||r.m3||r.m4||r.a1||r.a2)).map(r => r.month)
    )).sort((a,b)=>b-a);
    if (monthsWithData.length === 0) return;
    if (!monthsWithData.includes(month)) {
      setMonth(monthsWithData[0]);
    }
    setAutoSwitched(true);
  }, [isOpen, loading, records, year, month, autoSwitched]);

  const loadAll = async () => {
    setLoading(true);
    const [rec, leg] = await Promise.all([fetchAllRecords(), fetchAllLegacy()]);
    console.log('[MonthlyRoster] loaded', { records: rec.length, legacy: leg.length, sample: rec.slice(0, 3) });
    setRecords(rec);
    setLegacy(leg);
    setLoading(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    loadAll();
    const unsub = subscribeToTraining(() => loadAll());
    return unsub;
  }, [isOpen]);

  const empByName = useMemo(() => {
    const map: Record<string, Employee> = {};
    for (const e of employees) map[e.name.toLowerCase().trim()] = e;
    return map;
  }, [employees]);

  const peopleByMilestone = useMemo(() => {
    const result: Record<Milestone, { name: string; emp?: Employee; branch?: string }[]> = {
      m1: [], m2: [], m3: [], m4: [], a1: [], a2: [],
    };

    if (viewMode === 'monthly') {
      const monthRecords = records.filter(r => r.year === year && r.month === month);
      for (const ms of MILESTONES) {
        const seen = new Set<string>();
        for (const r of monthRecords) {
          if (r[ms] && !seen.has(r.manager_name.toLowerCase())) {
            seen.add(r.manager_name.toLowerCase());
            const emp = empByName[r.manager_name.toLowerCase().trim()];
            const br = branches.find(b => b.code === r.branch_code);
            result[ms].push({
              name: emp?.name || r.manager_name,
              emp,
              branch: br ? `${br.code}_${br.name}` : r.branch_code,
            });
          }
        }
      }
    } else {
      const cumulative: Record<string, { counts: Record<Milestone, number>; branchCode?: string }> = {};
      for (const l of legacy) {
        const k = l.manager_name.toLowerCase().trim();
        if (!cumulative[k]) cumulative[k] = { counts: { m1:0,m2:0,m3:0,m4:0,a1:0,a2:0 } };
        cumulative[k].counts.m1 += l.m1 || 0;
        cumulative[k].counts.m2 += l.m2 || 0;
        cumulative[k].counts.m3 += l.m3 || 0;
        cumulative[k].counts.m4 += l.m4 || 0;
        cumulative[k].counts.a1 += l.a1 || 0;
        cumulative[k].counts.a2 += l.a2 || 0;
      }
      for (const r of records) {
        if (r.year < year || (r.year === year && r.month <= month)) {
          const k = r.manager_name.toLowerCase().trim();
          if (!cumulative[k]) cumulative[k] = { counts: { m1:0,m2:0,m3:0,m4:0,a1:0,a2:0 } };
          for (const ms of MILESTONES) if (r[ms]) cumulative[k].counts[ms]++;
          cumulative[k].branchCode = r.branch_code;
        }
      }
      for (const [k, v] of Object.entries(cumulative)) {
        const emp = empByName[k];
        const br = v.branchCode ? branches.find(b => b.code === v.branchCode) : undefined;
        const branchLabel = br ? `${br.code}_${br.name}` : (emp ? `${emp.code}_${emp.branch}` : '');
        for (const ms of MILESTONES) {
          if (v.counts[ms] > 0) {
            result[ms].push({ name: emp?.name || k, emp, branch: branchLabel });
          }
        }
      }
    }

    for (const ms of MILESTONES) result[ms].sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [records, legacy, month, year, viewMode, empByName]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="modal-content bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-slate-700 text-white px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold">📅 월별 직군 (M1 / M2 / M3 / M4 / A1 / A2)</span>
            <span className="text-slate-300 text-sm">{year}년</span>
            <span className="text-[10px] bg-slate-600 px-2 py-0.5 rounded">
              records {records.length} · legacy {legacy.length}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white text-lg">&times;</button>
        </div>

        {/* 디버그 정보 - 데이터 로딩 상태 */}
        <div className="px-5 py-2 bg-yellow-50 border-b border-yellow-200 text-xs text-yellow-800 flex items-center gap-3 flex-wrap">
          <span className="font-bold">[DEBUG]</span>
          <span>records: <b>{records.length}</b></span>
          <span>legacy: <b>{legacy.length}</b></span>
          <span>{loading ? '⏳ 로딩 중' : '✓ 로딩 완료'}</span>
          <button
            onClick={async () => {
              if (!supabase) { alert('supabase null'); return; }
              const lines: string[] = [];
              lines.push(`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || '(없음)'}`);
              try {
                const r1 = await supabase.from('training_records').select('*', { count: 'exact', head: false }).limit(5);
                lines.push(`\n[training_records]`);
                lines.push(`error: ${r1.error ? JSON.stringify(r1.error) : 'none'}`);
                lines.push(`count: ${r1.count ?? '?'}, returned: ${r1.data?.length ?? 0}`);
                if (r1.data && r1.data.length > 0) lines.push(`sample: ${JSON.stringify(r1.data[0])}`);
              } catch (e: any) { lines.push(`exception: ${e?.message || e}`); }
              try {
                const r2 = await supabase.from('training_legacy').select('*', { count: 'exact', head: false }).limit(5);
                lines.push(`\n[training_legacy]`);
                lines.push(`error: ${r2.error ? JSON.stringify(r2.error) : 'none'}`);
                lines.push(`count: ${r2.count ?? '?'}, returned: ${r2.data?.length ?? 0}`);
                if (r2.data && r2.data.length > 0) lines.push(`sample: ${JSON.stringify(r2.data[0])}`);
              } catch (e: any) { lines.push(`exception: ${e?.message || e}`); }
              const txt = lines.join('\n');
              console.log('[DB 진단]', txt);
              alert(txt);
            }}
            className="px-2 py-1 bg-yellow-600 text-white rounded font-medium hover:bg-yellow-700"
          >
            🔍 DB 직접 조회 (진단)
          </button>
        </div>

        <div className="px-5 py-3 border-b bg-gray-50 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 flex-wrap">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
              <button
                key={m}
                onClick={() => setMonth(m)}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  m === month ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {m}월
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="inline-flex rounded border border-gray-200 bg-white text-xs overflow-hidden">
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1 ${viewMode === 'monthly' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                title="해당 월에 체크된 단계만"
              >
                {month}월만
              </button>
              <button
                onClick={() => setViewMode('cumulative')}
                className={`px-3 py-1 border-l border-gray-200 ${viewMode === 'cumulative' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                title="과거 + 선택 월까지 누적"
              >
                {month}월까지 누적
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-gray-400 py-12 text-sm">로딩 중...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {MILESTONES.map(ms => {
                const list = peopleByMilestone[ms];
                return (
                  <div key={ms} className={`border rounded-lg overflow-hidden ${MILESTONE_COLOR[ms]}`}>
                    <div className={`px-3 py-2 flex items-center justify-between border-b ${MILESTONE_HEAD[ms]}`}>
                      <span className="font-bold text-sm">{MILESTONE_LABEL[ms]}</span>
                      <span className="text-xs font-semibold">{list.length}명</span>
                    </div>
                    <div className="p-2 bg-white max-h-72 overflow-y-auto">
                      {list.length === 0 ? (
                        <div className="text-[11px] text-gray-300 text-center py-4">해당 인원 없음</div>
                      ) : (
                        <ul className="space-y-1">
                          {list.map((p, i) => {
                            const info = p.emp ? resolveEmpInfo(p.emp) : { realName: '', empCode: '' };
                            return (
                              <li key={`${ms}-${p.name}-${i}`} className="text-xs flex items-baseline justify-between gap-2 border-b border-gray-50 pb-1 last:border-0">
                                <span className="text-gray-800 font-medium">
                                  {p.name}
                                  {info.realName && <span className="text-gray-400 ml-1 text-[10px]">({info.realName})</span>}
                                </span>
                                <span className="text-[10px] text-gray-400 shrink-0">{p.branch}</span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 text-[11px] text-gray-400 px-1 leading-relaxed">
            ※ <b>"{month}월만"</b>: {year}년 {month}월에 직군 기록이 체크된 인원<br/>
            ※ <b>"{month}월까지 누적"</b>: 과거 누적(legacy) + {year}년 1월 ~ {month}월까지 한 번이라도 체크된 인원<br/>
            ※ 데이터는 💪 직군 화면에서 입력된 기록을 기반으로 합니다.
          </div>
        </div>
      </div>
    </div>
  );
}
