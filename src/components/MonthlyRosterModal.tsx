'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Employee, branches, Role } from '@/data/mockData';
import { resolveEmpInfo } from '@/data/amaranth';
import { loadAllSchedules, BranchSchedule } from '@/lib/scheduleApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  defaultMonth: number;
  year: number;
}

const ROLE_ORDER: Role[] = ['HM', 'Lead', 'Mgr'];
const ROLE_LABEL: Record<Role, string> = { HM: 'HM', Lead: '리드', Mgr: '매니저' };
const ROLE_BADGE: Record<Role, string> = {
  HM: 'bg-indigo-100 text-indigo-700',
  Lead: 'bg-rose-100 text-rose-700',
  Mgr: 'bg-gray-100 text-gray-600',
};

export default function MonthlyRosterModal({ isOpen, onClose, employees, defaultMonth, year }: Props) {
  const [month, setMonth] = useState(defaultMonth);
  const [schedules, setSchedules] = useState<Record<string, BranchSchedule>>({});
  const [loading, setLoading] = useState(true);
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setMonth(defaultMonth);
  }, [isOpen, defaultMonth]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    loadAllSchedules().then(s => {
      setSchedules(s);
      setLoading(false);
    });
  }, [isOpen]);

  // 선택된 월에 스케줄 셀이 하나라도 있는 사람들 (실제 근무자)
  const activeKeysByBranch = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const b of branches) {
      const key = `${b.code}-${month}-${year}`;
      const sched = schedules[key];
      const active = new Set<string>();
      if (sched) {
        for (const empKey of Object.keys(sched)) {
          const cells = sched[empKey];
          if (cells && cells.some(c => c && (c.shift || c.memo))) {
            active.add(empKey);
          }
        }
      }
      map[b.code] = active;
    }
    return map;
  }, [schedules, month, year]);

  const branchesToShow = filterBranch === 'all'
    ? branches
    : branches.filter(b => b.code === filterBranch);

  // 통계
  const stats = useMemo(() => {
    let total = 0;
    const byRole: Record<Role, number> = { HM: 0, Lead: 0, Mgr: 0 };
    for (const b of branchesToShow) {
      const active = activeKeysByBranch[b.code] || new Set();
      const branchEmps = employees.filter(e => e.code === b.code);
      const filtered = showOnlyActive
        ? branchEmps.filter(e => active.has(`${e.code}-${e.num}`))
        : branchEmps;
      total += filtered.length;
      for (const e of filtered) byRole[e.role] = (byRole[e.role] || 0) + 1;
    }
    return { total, byRole };
  }, [branchesToShow, activeKeysByBranch, employees, showOnlyActive]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="modal-content bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-700 text-white px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold">📅 월별 직군</span>
            <span className="text-slate-300 text-sm">{year}년 지점별 직원 현황</span>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white text-lg">&times;</button>
        </div>

        {/* Controls */}
        <div className="px-5 py-3 border-b bg-gray-50 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
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
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={filterBranch}
              onChange={e => setFilterBranch(e.target.value)}
              className="text-xs px-2 py-1 border border-gray-200 rounded bg-white"
            >
              <option value="all">전체 지점</option>
              {branches.map(b => (
                <option key={b.code} value={b.code}>{b.code}_{b.name}</option>
              ))}
            </select>
            <label className="text-xs text-gray-600 flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyActive}
                onChange={e => setShowOnlyActive(e.target.checked)}
              />
              {month}월 스케줄 있는 인원만
            </label>
          </div>
        </div>

        {/* Stats bar */}
        <div className="px-5 py-2 bg-indigo-50 border-b flex items-center gap-3 text-xs">
          <span className="font-semibold text-indigo-800">{month}월 합계</span>
          <span className="px-2 py-0.5 bg-white rounded border border-indigo-200">총 {stats.total}명</span>
          <span className="px-2 py-0.5 bg-white rounded border border-indigo-200">HM {stats.byRole.HM}</span>
          <span className="px-2 py-0.5 bg-white rounded border border-indigo-200">리드 {stats.byRole.Lead}</span>
          <span className="px-2 py-0.5 bg-white rounded border border-indigo-200">매니저 {stats.byRole.Mgr}</span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-gray-400 py-12 text-sm">로딩 중...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {branchesToShow.map(b => {
                const active = activeKeysByBranch[b.code] || new Set();
                const branchEmps = employees.filter(e => e.code === b.code);
                const visible = showOnlyActive
                  ? branchEmps.filter(e => active.has(`${e.code}-${e.num}`))
                  : branchEmps;
                if (visible.length === 0) return null;

                const grouped: Record<Role, Employee[]> = { HM: [], Lead: [], Mgr: [] };
                for (const e of visible) grouped[e.role]?.push(e);
                for (const r of ROLE_ORDER) grouped[r].sort((a,b)=>a.num-b.num);

                return (
                  <div key={b.code} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-100 px-3 py-1.5 flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-700">
                        <span className="text-slate-400 text-xs mr-1">{b.code}</span>
                        {b.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {visible.length}명{b.to ? ` / TO ${b.to}` : ''}
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      {ROLE_ORDER.map(role => {
                        if (grouped[role].length === 0) return null;
                        return (
                          <div key={role} className="flex items-start gap-2 text-xs">
                            <span className={`shrink-0 w-12 text-center font-semibold px-1.5 py-0.5 rounded ${ROLE_BADGE[role]}`}>
                              {ROLE_LABEL[role]}
                            </span>
                            <div className="flex flex-wrap gap-1 flex-1">
                              {grouped[role].map(e => {
                                const info = resolveEmpInfo(e);
                                const isActive = active.has(`${e.code}-${e.num}`);
                                return (
                                  <span
                                    key={`${e.code}-${e.num}`}
                                    title={`${info.realName || '실명없음'} / 사번 ${info.empCode || '-'}\n입사일 ${e.hireDate || '-'}`}
                                    className={`px-1.5 py-0.5 rounded border text-[11px] ${
                                      isActive
                                        ? 'bg-white border-gray-200 text-gray-700'
                                        : 'bg-gray-50 border-dashed border-gray-200 text-gray-400'
                                    }`}
                                  >
                                    {e.name}
                                    {info.realName && (
                                      <span className="text-gray-400 ml-1">({info.realName})</span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 text-[11px] text-gray-400 px-1">
            ※ "{month}월 스케줄 있는 인원만" 체크 해제하면 현재 등록된 모든 인원을 볼 수 있습니다.
            점선 박스는 해당 월에 스케줄 데이터가 없는 인원입니다.
          </div>
        </div>
      </div>
    </div>
  );
}
