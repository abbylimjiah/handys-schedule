'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Employee } from '@/data/mockData';
import { CurrentUser } from '@/data/auth';
import {
  TrainingRecord,
  fetchRecordsByBranchMonth,
  saveRecord,
  subscribeToTraining,
} from '@/lib/trainingApi';

interface Props {
  branchCode: string;
  branchName: string;
  year: number;
  month: number;
  employees: Employee[];
  currentUser: CurrentUser | null;
  canEdit: boolean; // HM or master
}

const CATEGORIES: Array<{ key: 'm1'|'m2'|'m3'|'m4'|'a1'|'a2'; label: string; group: 'main'|'aux' }> = [
  { key: 'm1', label: 'M1', group: 'main' },
  { key: 'm2', label: 'M2', group: 'main' },
  { key: 'm3', label: 'M3', group: 'main' },
  { key: 'm4', label: 'M4', group: 'main' },
  { key: 'a1', label: 'A1', group: 'aux' },
  { key: 'a2', label: 'A2', group: 'aux' },
];

export default function TrainingSection({ branchCode, branchName, year, month, employees, currentUser, canEdit }: Props) {
  const [records, setRecords] = useState<Record<string, TrainingRecord>>({});
  const [saving, setSaving] = useState<string | null>(null);
  // 기본 접혀있음 (스케줄 가독성 우선)
  const [expanded, setExpanded] = useState(false);

  const branchEmployees = employees.filter(e => e.code === branchCode && e.name.trim());

  const loadData = useCallback(async () => {
    const rows = await fetchRecordsByBranchMonth(branchCode, year, month);
    const map: Record<string, TrainingRecord> = {};
    for (const r of rows) map[r.manager_name.toLowerCase()] = r;
    setRecords(map);
  }, [branchCode, year, month]);

  useEffect(() => {
    loadData();
    const unsub = subscribeToTraining(() => loadData());
    return unsub;
  }, [loadData]);

  // 2026년 5월부터만 입력 허용
  const isInputAllowed = year > 2026 || (year === 2026 && month >= 5);

  const toggle = async (emp: Employee, key: 'm1'|'m2'|'m3'|'m4'|'a1'|'a2') => {
    if (!canEdit || !isInputAllowed) return;
    // 본인이 아닌 다른 매니저는 HM/Master만 체크 가능
    const isSelf = currentUser?.name?.toLowerCase().trim() === emp.name.toLowerCase().trim();
    const isHM = currentUser?.role === 'master' ||
      employees.some(e => e.code === branchCode && e.role === 'HM' && e.name.toLowerCase().trim() === (currentUser?.name || '').toLowerCase().trim());
    if (!isSelf && !isHM) return;

    const nameKey = emp.name.toLowerCase();
    const existing = records[nameKey];
    const next: TrainingRecord = {
      manager_name: emp.name,
      branch_code: branchCode,
      year, month,
      m1: existing?.m1 || false,
      m2: existing?.m2 || false,
      m3: existing?.m3 || false,
      m4: existing?.m4 || false,
      a1: existing?.a1 || false,
      a2: existing?.a2 || false,
      updated_by: currentUser?.name || '',
    };
    (next as any)[key] = !(existing as any)?.[key];

    setRecords(prev => ({ ...prev, [nameKey]: next }));
    setSaving(nameKey);
    const ok = await saveRecord(next);
    setSaving(null);
    if (!ok) {
      alert('저장 실패! 네트워크 확인해주세요.');
      loadData();
    }
  };

  if (branchEmployees.length === 0) return null;

  return (
    <div className="bg-white border-t-2 border-indigo-200">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-3 md:px-6 py-2 hover:bg-indigo-50 transition"
      >
        <h3 className="text-sm md:text-base font-bold text-gray-800 flex items-center gap-2">
          <span className={`inline-block transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
          <span>💪</span>
          <span>{year}년 {month}월 직군 이수</span>
          <span className="text-xs text-gray-500 font-normal hidden sm:inline">({branchCode}_{branchName})</span>
        </h3>
        <div className="flex items-center gap-2">
          {!isInputAllowed && (
            <span className="text-[10px] md:text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              ℹ️ 5월부터 입력
            </span>
          )}
          {isInputAllowed && !canEdit && (
            <span className="text-[10px] md:text-xs text-gray-500">조회 전용</span>
          )}
          <span className="text-[10px] md:text-xs text-gray-400">{expanded ? '접기' : '펼치기'}</span>
        </div>
      </button>

      {expanded && (
      <div className="px-3 md:px-6 pb-3 md:pb-4">
      <div className="overflow-x-auto">
        <table className="w-full text-xs md:text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-2 py-1.5 border border-gray-200 font-medium text-gray-700 sticky left-0 bg-gray-50 z-10">매니저</th>
              <th colSpan={4} className="text-center px-2 py-1.5 border border-gray-200 font-medium text-blue-700 bg-blue-50">주 직군</th>
              <th colSpan={2} className="text-center px-2 py-1.5 border border-gray-200 font-medium text-purple-700 bg-purple-50">보조</th>
            </tr>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 sticky left-0 bg-gray-50 z-10"></th>
              {CATEGORIES.map(c => (
                <th key={c.key} className={`text-center px-2 py-1 border border-gray-200 font-medium ${c.group === 'main' ? 'text-blue-700 bg-blue-50' : 'text-purple-700 bg-purple-50'}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branchEmployees.map(emp => {
              const rec = records[emp.name.toLowerCase()];
              const nameKey = emp.name.toLowerCase();
              return (
                <tr key={`${emp.code}-${emp.num}`} className="hover:bg-gray-50">
                  <td className="px-2 py-1.5 border border-gray-200 sticky left-0 bg-white z-10">
                    <span className="font-medium">{emp.name}</span>
                    {emp.role === 'HM' && <span className="ml-1 text-[10px] text-indigo-600 font-semibold">HM</span>}
                    {saving === nameKey && <span className="ml-1 text-[10px] text-blue-500 animate-pulse">저장중...</span>}
                  </td>
                  {CATEGORIES.map(c => {
                    const checked = Boolean((rec as any)?.[c.key]);
                    return (
                      <td key={c.key} className={`text-center border border-gray-200 ${c.group === 'main' ? 'bg-blue-50/30' : 'bg-purple-50/30'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!canEdit || !isInputAllowed}
                          onChange={() => toggle(emp, c.key)}
                          className="cursor-pointer w-4 h-4 md:w-5 md:h-5 accent-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] md:text-xs text-gray-400 mt-2">
        💡 매달 말 매니저 별 이수 직군 체크 (여러개 동시 체크 가능 · 본인 체크 가능 · HM은 전체 편집)
      </p>
      </div>
      )}
    </div>
  );
}
