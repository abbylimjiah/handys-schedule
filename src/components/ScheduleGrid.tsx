'use client';

import React, { useState, useMemo } from 'react';
import {
  getEmployees,
  getMonthInfo,
  generateScheduleData,
  getShiftStyle,
  CellData,
  Employee,
} from '@/data/mockData';
import CellModal from './CellModal';

interface ScheduleGridProps {
  branchCode: string;
  month: number;
  year: number;
  employees: Employee[];
  onEmployeeUpdate?: (employee: Employee, field: 'name', value: string) => void;
}

export default function ScheduleGrid({ branchCode, month, year, employees, onEmployeeUpdate }: ScheduleGridProps) {
  type BranchSchedule = Record<string, CellData[]>;
  const [scheduleCache, setScheduleCache] = useState<Record<string, BranchSchedule>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState<{
    employee: Employee;
    dayIndex: number;
    cellData: CellData;
    date: number;
    dowLabel: string;
    holiday?: string;
  } | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  const branchEmployees = useMemo(
    () => employees.filter(e => e.code === branchCode),
    [employees, branchCode]
  );

  const days = useMemo(() => getMonthInfo(year, month), [year, month]);

  const cacheKey = `${branchCode}-${month}-${year}`;

  const currentSchedule: BranchSchedule = useMemo(() => {
    if (!scheduleCache[cacheKey]) {
      const generated = generateScheduleData(branchCode, month, year, employees);
      setScheduleCache(prev => ({ ...prev, [cacheKey]: generated }));
      return generated;
    }
    return scheduleCache[cacheKey];
  }, [branchCode, month, year, cacheKey, scheduleCache, employees]);

  const handleCellClick = (emp: Employee, dayIndex: number) => {
    const empKey = `${emp.code}-${emp.num}`;
    const cellData = (currentSchedule[empKey] && currentSchedule[empKey][dayIndex]) || {
      shift: '' as const,
      leaveRequest: false,
      kakaoT: false,
      memo: '',
    };
    setModalInfo({
      employee: emp,
      dayIndex,
      cellData,
      date: days[dayIndex].date,
      dowLabel: days[dayIndex].dowLabel,
      holiday: days[dayIndex].holiday,
    });
    setModalOpen(true);
  };

  const handleSave = (data: CellData) => {
    if (!modalInfo) return;
    const empKey = `${modalInfo.employee.code}-${modalInfo.employee.num}`;
    setScheduleCache(prev => {
      const branchSchedule: BranchSchedule = { ...(prev[cacheKey] || currentSchedule) };
      const empSchedule = [...(branchSchedule[empKey] || [])];
      empSchedule[modalInfo.dayIndex] = data;
      branchSchedule[empKey] = empSchedule;
      return { ...prev, [cacheKey]: branchSchedule };
    });
  };

  const handleNameDoubleClick = (emp: Employee) => {
    const empKey = `${emp.code}-${emp.num}`;
    setEditingName(empKey);
    setEditNameValue(emp.name);
  };

  const handleNameSave = (emp: Employee) => {
    if (onEmployeeUpdate && editNameValue !== emp.name) {
      onEmployeeUpdate(emp, 'name', editNameValue);
    }
    setEditingName(null);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent, emp: Employee) => {
    if (e.key === 'Enter') handleNameSave(emp);
    if (e.key === 'Escape') setEditingName(null);
  };

  // Count today's working/off
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayIndex = isCurrentMonth ? today.getDate() - 1 : -1;
  let workingCount = 0;
  let offCount = 0;
  if (todayIndex >= 0) {
    branchEmployees.forEach(emp => {
      const empKey = `${emp.code}-${emp.num}`;
      const cell = currentSchedule[empKey]?.[todayIndex];
      if (cell && cell.shift.startsWith('#')) {
        offCount++;
      } else {
        workingCount++;
      }
    });
  }

  const roleLabel = (role: string) => {
    switch (role) {
      case 'Lead': return '리드';
      case 'HM': return 'HM';
      case 'Mgr': return '매니저';
      default: return role;
    }
  };

  if (branchEmployees.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        해당 지점에 직원 데이터가 없습니다.
      </div>
    );
  }

  return (
    <>
      <div className="schedule-grid overflow-auto flex-1 bg-white">
        <table className="schedule-table border-collapse text-xs min-w-max">
          <thead>
            <tr>
              <th className="bg-slate-600 text-white px-1 py-1.5 text-center font-semibold w-8 border-r border-slate-500">
                No
              </th>
              <th className="bg-slate-600 text-white px-2 py-1.5 text-left font-semibold w-20 border-r border-slate-500">
                이름
              </th>
              <th className="bg-slate-600 text-white px-1 py-1.5 text-center font-semibold w-12 border-r border-slate-500">
                직책
              </th>
              {days.map((day, i) => {
                const isSat = day.dow === 6;
                const isSun = day.dow === 0;
                const isHoliday = !!day.holiday;
                return (
                  <th
                    key={i}
                    className={`px-0 py-1 text-center font-medium w-10 min-w-[40px] border-r border-slate-500 ${
                      isHoliday || isSun
                        ? 'bg-red-800 text-red-100'
                        : isSat
                        ? 'bg-blue-800 text-blue-100'
                        : 'bg-slate-600 text-white'
                    }`}
                    title={day.holiday || ''}
                  >
                    <div className="text-[10px] leading-tight">
                      {day.holiday ? (
                        <span className="text-yellow-300">{day.dowLabel}</span>
                      ) : (
                        day.dowLabel
                      )}
                    </div>
                    <div className="font-bold">{day.date}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* MEMO row */}
            <tr className="bg-yellow-50">
              <td className="bg-yellow-50 border-r border-b border-gray-200 text-center text-gray-400 text-[10px]">
              </td>
              <td
                colSpan={2}
                className="bg-yellow-50 border-r border-b border-gray-200 px-2 py-1 text-yellow-700 font-semibold text-[10px]"
              >
                MEMO
              </td>
              {days.map((day, i) => (
                <td
                  key={i}
                  className={`border-r border-b border-gray-200 px-0.5 py-1 text-center text-[10px] text-yellow-600 ${
                    day.holiday || day.dow === 0 ? 'bg-red-50/50' : day.dow === 6 ? 'bg-blue-50/50' : 'bg-yellow-50'
                  }`}
                >
                  {day.holiday && (
                    <span className="text-[8px] text-red-400 font-medium">{day.holiday}</span>
                  )}
                </td>
              ))}
            </tr>
            {branchEmployees.map((emp, empIdx) => {
              const empKey = `${emp.code}-${emp.num}`;
              const empSchedule = currentSchedule[empKey] || [];
              const isEditing = editingName === empKey;

              return (
                <tr
                  key={empKey}
                  className={`${empIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30`}
                >
                  {/* Row number */}
                  <td className={`${empIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-r border-b border-gray-200 text-center text-gray-400 font-mono`}>
                    {emp.num}
                  </td>
                  {/* Name - double click to edit */}
                  <td
                    className={`${empIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-r border-b border-gray-200 px-2 py-1.5 font-medium text-gray-800 whitespace-nowrap`}
                    onDoubleClick={() => handleNameDoubleClick(emp)}
                    title="더블클릭하여 이름 수정"
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        type="text"
                        value={editNameValue}
                        onChange={e => setEditNameValue(e.target.value)}
                        onBlur={() => handleNameSave(emp)}
                        onKeyDown={e => handleNameKeyDown(e, emp)}
                        className="w-full px-1 py-0 text-xs border border-blue-400 rounded focus:outline-none bg-blue-50"
                      />
                    ) : (
                      <span className={emp.name ? '' : 'text-gray-300 italic'}>
                        {emp.name || '(미정)'}
                      </span>
                    )}
                  </td>
                  {/* Role */}
                  <td className={`${empIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-r border-b border-gray-200 text-center py-1.5`}>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        emp.role === 'HM'
                          ? 'bg-indigo-100 text-indigo-700'
                          : emp.role === 'Lead'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {roleLabel(emp.role)}
                    </span>
                  </td>
                  {/* Schedule cells */}
                  {days.map((day, dayIdx) => {
                    const cell = empSchedule[dayIdx];
                    if (!cell) return (
                      <td key={dayIdx} className="border-r border-b border-gray-200 w-10 h-8"></td>
                    );

                    const style = getShiftStyle(cell.shift);
                    const isSat = day.dow === 6;
                    const isSun = day.dow === 0;
                    const isHoliday = !!day.holiday;
                    const hasIndicator = cell.leaveRequest || cell.kakaoT;
                    const hasMemo = cell.memo.length > 0;
                    const isToday = dayIdx === todayIndex;

                    let bgOverride = '';
                    if (isHoliday || isSun) bgOverride = 'bg-red-50/40';
                    else if (isSat) bgOverride = 'bg-blue-50/40';

                    return (
                      <td
                        key={dayIdx}
                        className={`border-r border-b border-gray-200 p-0 relative ${bgOverride} ${
                          isToday ? 'ring-2 ring-inset ring-blue-400/50' : ''
                        }`}
                        onClick={() => handleCellClick(emp, dayIdx)}
                      >
                        <div
                          className={`shift-cell mx-auto my-0.5 w-9 h-7 flex items-center justify-center rounded text-[10px] font-bold relative ${style.bg} ${style.text}`}
                          title={`${emp.name || '(미정)'} - ${day.date}일 (${day.dowLabel}): ${cell.shift}${cell.leaveRequest ? ' [연차상신]' : ''}${cell.kakaoT ? ' [카카오T]' : ''}${hasMemo ? ` [${cell.memo}]` : ''}${day.holiday ? ` [${day.holiday}]` : ''}`}
                        >
                          {style.label}
                          {hasIndicator && (
                            <div className="cell-indicator">
                              {cell.leaveRequest && <span className="dot-leave" />}
                              {cell.kakaoT && <span className="dot-taxi" />}
                            </div>
                          )}
                          {hasMemo && (
                            <div className="absolute top-0 right-0.5 text-[8px] text-red-400">*</div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center gap-3 text-[10px] shrink-0 flex-wrap">
        <span className="text-gray-400 font-medium">근무:</span>
        {[
          { label: 'D6', bg: 'bg-amber-100', text: 'text-amber-800' },
          { label: 'D9', bg: 'bg-blue-100', text: 'text-blue-800' },
          { label: 'M', bg: 'bg-violet-100', text: 'text-violet-800' },
          { label: 'E', bg: 'bg-orange-100', text: 'text-orange-800' },
          { label: 'N', bg: 'bg-teal-100', text: 'text-teal-800' },
        ].map(item => (
          <span key={item.label} className={`${item.bg} ${item.text} px-1.5 py-0.5 rounded font-bold`}>
            {item.label}
          </span>
        ))}
        <span className="text-gray-300">|</span>
        <span className="text-gray-400 font-medium">휴무:</span>
        {[
          { label: '#', bg: 'bg-gray-100', text: 'text-gray-500' },
          { label: '연차', bg: 'bg-pink-100', text: 'text-pink-700' },
          { label: '대체', bg: 'bg-slate-200', text: 'text-slate-600' },
          { label: '병가', bg: 'bg-red-100', text: 'text-red-600' },
        ].map(item => (
          <span key={item.label} className={`${item.bg} ${item.text} px-1.5 py-0.5 rounded font-bold`}>
            {item.label}
          </span>
        ))}
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1">
          <span className="dot-leave inline-block" /> 연차상신
        </span>
        <span className="flex items-center gap-1">
          <span className="dot-taxi inline-block" /> 카카오T
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-red-50 border border-red-200 rounded-sm" /> 공휴일/일요일
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-blue-50 border border-blue-200 rounded-sm" /> 토요일
        </span>
      </div>

      {/* Cell Modal */}
      {modalInfo && (
        <CellModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          cellData={modalInfo.cellData}
          employeeName={modalInfo.employee.name}
          date={modalInfo.date}
          month={month}
          dowLabel={modalInfo.dowLabel}
          holiday={modalInfo.holiday}
          onSave={handleSave}
        />
      )}
    </>
  );
}
