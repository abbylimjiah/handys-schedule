'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  getMonthInfo,
  generateScheduleData,
  getShiftStyle,
  shiftCategories,
  shiftDescriptions,
  CellData,
  Employee,
  ShiftType,
} from '@/data/mockData';
import CellModal from './CellModal';
import { loadSchedule, saveSchedule, subscribeToSchedule, loadAllSchedules, BranchSchedule as ApiBranchSchedule } from '@/lib/scheduleApi';
import { fetchAllMemos, saveDayMemo as saveMemoApi, subscribeToMemos } from '@/lib/memosApi';
import { getCurrentUser } from '@/data/auth';

interface ScheduleGridProps {
  branchCode: string;
  month: number;
  year: number;
  employees: Employee[];
  onEmployeeUpdate?: (employee: Employee, field: 'name', value: string) => void;
  canEdit?: boolean;
  canEditLeave?: boolean;
  canDelete?: boolean;
}

const bulkShiftOptions: { code: ShiftType; label: string }[] = [
  { code: 'D6', label: 'D6' },
  { code: 'D9', label: 'D9' },
  { code: 'M', label: 'M' },
  { code: 'E', label: 'E' },
  { code: 'N', label: 'N' },
  { code: '#', label: '#' },
  { code: '#(연차)', label: '연차' },
  { code: '#(대체)', label: '대체' },
  { code: 'D9/반', label: 'D9반' },
  { code: 'E/반', label: 'E반' },
  { code: '파견', label: '파견' },
];

// Summary table column config
const summaryCols = [
  { key: 'D6', label: 'D6', bg: 'bg-amber-100', text: 'text-amber-800', hBg: 'bg-amber-500' },
  { key: 'D9', label: 'D9', bg: 'bg-blue-100', text: 'text-blue-800', hBg: 'bg-blue-600' },
  { key: 'M', label: 'M', bg: 'bg-violet-100', text: 'text-violet-800', hBg: 'bg-violet-600' },
  { key: 'E', label: 'E', bg: 'bg-orange-100', text: 'text-orange-800', hBg: 'bg-orange-500' },
  { key: 'N', label: 'N', bg: 'bg-teal-100', text: 'text-teal-800', hBg: 'bg-teal-600' },
  { key: '#', label: '#', bg: 'bg-gray-100', text: 'text-gray-600', hBg: 'bg-gray-500' },
  { key: 'leave', label: '연차', bg: 'bg-pink-100', text: 'text-pink-700', hBg: 'bg-pink-600' },
  { key: 'work', label: '근무일', bg: 'bg-blue-50', text: 'text-blue-800', hBg: 'bg-blue-800' },
  { key: 'off', label: '휴무일', bg: 'bg-gray-50', text: 'text-gray-600', hBg: 'bg-gray-600' },
];

export default function ScheduleGrid({ branchCode, month, year, employees, onEmployeeUpdate, canEdit = true, canEditLeave = true, canDelete = false }: ScheduleGridProps) {
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
  const [showSummary, setShowSummary] = useState(false);
  const [dayMemos, setDayMemos] = useState<Record<string, string>>({}); // key: "branchCode-month-dayIdx"
  const [editingMemoIdx, setEditingMemoIdx] = useState<number | null>(null);
  const [editingMemoValue, setEditingMemoValue] = useState('');

  // Bulk mode state
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkShift, setBulkShift] = useState<ShiftType | 'DELETE'>('D9');
  const [isDragging, setIsDragging] = useState(false);
  const [dragEmpKey, setDragEmpKey] = useState<string | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  // Copy/Paste state
  const [copiedRow, setCopiedRow] = useState<{ empName: string; data: CellData[] } | null>(null);

  const todayColRef = useRef<HTMLTableCellElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Load day memos from Supabase + subscribe
  useEffect(() => {
    try {
      const saved = localStorage.getItem('handys-day-memos');
      if (saved) setDayMemos(JSON.parse(saved));
    } catch {}
    (async () => {
      const memos = await fetchAllMemos();
      setDayMemos(memos);
    })();
    const unsub = subscribeToMemos(memos => setDayMemos(memos));
    return unsub;
  }, []);

  // Save schedule to Supabase + localStorage
  const persistSchedule = useCallback(async (bCode: string, yr: number, mo: number, schedule: BranchSchedule) => {
    const user = getCurrentUser();
    await saveSchedule(bCode, yr, mo, schedule as ApiBranchSchedule, user?.name);
  }, []);

  // Load all schedules on mount (Supabase 우선, localStorage 폴백)
  useEffect(() => {
    (async () => {
      const loaded = await loadAllSchedules();
      if (Object.keys(loaded).length > 0) setScheduleCache(loaded as Record<string, BranchSchedule>);
    })();
  }, []);

  useEffect(() => {
    if (todayColRef.current && gridContainerRef.current) {
      const container = gridContainerRef.current;
      const cell = todayColRef.current;
      const cellLeft = cell.offsetLeft;
      const containerWidth = container.clientWidth;
      container.scrollLeft = cellLeft - containerWidth / 3;
    }
  }, [branchCode, month, year]);

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

  // Load current branch/month schedule from Supabase if not cached
  useEffect(() => {
    if (scheduleCache[cacheKey]) return;
    (async () => {
      const loaded = await loadSchedule(branchCode, year, month);
      if (loaded) {
        setScheduleCache(prev => ({ ...prev, [cacheKey]: loaded as BranchSchedule }));
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchCode, year, month, cacheKey]);

  // Realtime subscription - 다른 사람이 수정하면 자동 반영!
  useEffect(() => {
    const unsubscribe = subscribeToSchedule(branchCode, year, month, (newSchedule) => {
      setScheduleCache(prev => ({ ...prev, [cacheKey]: newSchedule as BranchSchedule }));
    });
    return unsubscribe;
  }, [branchCode, year, month, cacheKey]);

  const handleCellClick = (emp: Employee, dayIndex: number) => {
    if (!canEdit) return; // Read-only mode
    if (bulkMode) {
      const empKey = `${emp.code}-${emp.num}`;
      applyBulkShift(empKey, dayIndex);
      return;
    }
    const empKey = `${emp.code}-${emp.num}`;
    const cellData = (currentSchedule[empKey] && currentSchedule[empKey][dayIndex]) || {
      shift: '' as const, leaveRequest: false, kakaoT: false, memo: '',
    };
    setModalInfo({
      employee: emp, dayIndex, cellData,
      date: days[dayIndex].date, dowLabel: days[dayIndex].dowLabel, holiday: days[dayIndex].holiday,
    });
    setModalOpen(true);
  };

  const applyBulkShift = useCallback((empKey: string, dayIndex: number) => {
    setScheduleCache(prev => {
      const branchSchedule: BranchSchedule = { ...(prev[cacheKey] || currentSchedule) };
      const empSchedule = [...(branchSchedule[empKey] || [])];
      if (bulkShift === 'DELETE') {
        empSchedule[dayIndex] = { shift: '' as ShiftType, leaveRequest: false, kakaoT: false, memo: '' };
      } else {
        empSchedule[dayIndex] = {
          shift: bulkShift,
          leaveRequest: bulkShift.startsWith('#') && bulkShift !== '#' ? true : empSchedule[dayIndex]?.leaveRequest || false,
          kakaoT: empSchedule[dayIndex]?.kakaoT || false,
          memo: empSchedule[dayIndex]?.memo || '',
        };
      }
      branchSchedule[empKey] = empSchedule;
      persistSchedule(branchCode, year, month, branchSchedule);
      return { ...prev, [cacheKey]: branchSchedule };
    });
  }, [cacheKey, currentSchedule, bulkShift, persistSchedule, branchCode, year, month]);

  const handleCellMouseDown = (emp: Employee, dayIndex: number) => {
    if (!bulkMode || !canEdit) return;
    const empKey = `${emp.code}-${emp.num}`;
    setIsDragging(true);
    setDragEmpKey(empKey);
    setSelectedCells(new Set([`${empKey}-${dayIndex}`]));
    applyBulkShift(empKey, dayIndex);
  };

  const handleCellMouseEnter = (emp: Employee, dayIndex: number) => {
    if (!bulkMode || !isDragging || !canEdit) return;
    const empKey = `${emp.code}-${emp.num}`;
    if (empKey !== dragEmpKey) return;
    const cellId = `${empKey}-${dayIndex}`;
    if (!selectedCells.has(cellId)) {
      setSelectedCells(prev => { const next = new Set(Array.from(prev)); next.add(cellId); return next; });
      applyBulkShift(empKey, dayIndex);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) { setIsDragging(false); setDragEmpKey(null); setSelectedCells(new Set()); }
  };

  const handleSave = (data: CellData) => {
    if (!modalInfo) return;
    const empKey = `${modalInfo.employee.code}-${modalInfo.employee.num}`;
    setScheduleCache(prev => {
      const branchSchedule: BranchSchedule = { ...(prev[cacheKey] || currentSchedule) };
      const empSchedule = [...(branchSchedule[empKey] || [])];
      empSchedule[modalInfo.dayIndex] = data;
      branchSchedule[empKey] = empSchedule;
      persistSchedule(branchCode, year, month, branchSchedule);
      return { ...prev, [cacheKey]: branchSchedule };
    });
  };

  const handleDelete = () => {
    if (!modalInfo) return;
    const empKey = `${modalInfo.employee.code}-${modalInfo.employee.num}`;
    setScheduleCache(prev => {
      const branchSchedule: BranchSchedule = { ...(prev[cacheKey] || currentSchedule) };
      const empSchedule = [...(branchSchedule[empKey] || [])];
      empSchedule[modalInfo.dayIndex] = { shift: '' as ShiftType, leaveRequest: false, kakaoT: false, memo: '' };
      branchSchedule[empKey] = empSchedule;
      persistSchedule(branchCode, year, month, branchSchedule);
      return { ...prev, [cacheKey]: branchSchedule };
    });
  };

  const saveDayMemo = (dayIdx: number, value: string) => {
    const key = `${branchCode}-${month}-${dayIdx}`;
    setDayMemos(prev => ({ ...prev, [key]: value }));
    // Supabase + localStorage 동시 저장
    saveMemoApi(branchCode, year, month, dayIdx, value);
  };

  // === 복사/붙여넣기 ===
  const handleCopyRow = (emp: Employee) => {
    const empKey = `${emp.code}-${emp.num}`;
    const data = currentSchedule[empKey] || [];
    setCopiedRow({ empName: emp.name || '(미정)', data: JSON.parse(JSON.stringify(data)) });
  };

  const handlePasteRow = (targetEmp: Employee) => {
    if (!copiedRow) return;
    if (!canEdit) return;
    const empKey = `${targetEmp.code}-${targetEmp.num}`;
    setScheduleCache(prev => {
      const branchSchedule: BranchSchedule = { ...(prev[cacheKey] || currentSchedule) };
      // 복사한 데이터를 목표 행에 적용 (깊은 복사)
      branchSchedule[empKey] = JSON.parse(JSON.stringify(copiedRow.data));
      persistSchedule(branchCode, year, month, branchSchedule);
      return { ...prev, [cacheKey]: branchSchedule };
    });
  };

  // 외부 시트(엑셀/구글시트) 클립보드 붙여넣기 파싱
  const parseClipboardShifts = (text: string): ShiftType[] => {
    // 탭/줄바꿈/공백으로 분리
    const raw = text.replace(/\r/g, '').trim();
    const cells = raw.includes('\t') || raw.includes('\n')
      ? raw.split(/[\t\n]/)
      : raw.split(/\s+/);
    const validShifts = new Set<string>([
      'D6', 'D9', 'M', 'E', 'N',
      'D6/반', 'D9/반', 'M/반', 'E/반', 'N/반',
      'D6/반반', 'D9/반반', 'M/반반', 'E/반반', 'N/반반',
      '#', '#(연차)', '#(대체)', '#(병가)', '#(공가)', '#(보건)',
      '#(경조)', '#(생일)', '#(출산)', '#(육아)', '#(태아)', '#(창립기념일)', '#(장기근속)',
      '파견', 'D9/단',
    ]);
    const korMap: Record<string, ShiftType> = {
      '연차': '#(연차)', '대체': '#(대체)', '병가': '#(병가)', '공가': '#(공가)',
      '보건': '#(보건)', '경조': '#(경조)', '생일': '#(생일)', '출산': '#(출산)',
      '육아': '#(육아)', '태아': '#(태아)', '창립': '#(창립기념일)', '장기': '#(장기근속)', '장기근속': '#(장기근속)',
    };
    return cells.map(c => {
      const t = c.trim();
      if (validShifts.has(t)) return t as ShiftType;
      if (korMap[t]) return korMap[t];
      return '' as ShiftType;
    });
  };

  const handlePasteFromClipboard = async (targetEmp: Employee, startDayIdx: number = 0) => {
    if (!canEdit) return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const shifts = parseClipboardShifts(text);
      if (shifts.length === 0) return;

      const empKey = `${targetEmp.code}-${targetEmp.num}`;
      setScheduleCache(prev => {
        const branchSchedule: BranchSchedule = { ...(prev[cacheKey] || currentSchedule) };
        const empSchedule = [...(branchSchedule[empKey] || [])];
        shifts.forEach((shift, i) => {
          const dayIdx = startDayIdx + i;
          if (dayIdx >= days.length) return;
          const existing = empSchedule[dayIdx] || { shift: '' as ShiftType, leaveRequest: false, kakaoT: false, memo: '' };
          empSchedule[dayIdx] = {
            ...existing,
            shift,
            leaveRequest: shift.startsWith('#') && shift !== '#' ? true : existing.leaveRequest,
          };
        });
        branchSchedule[empKey] = empSchedule;
        persistSchedule(branchCode, year, month, branchSchedule);
        return { ...prev, [cacheKey]: branchSchedule };
      });
    } catch (e) {
      alert('클립보드 읽기 실패. 브라우저 권한 허용 필요!');
      console.error(e);
    }
  };

  const handleNameDoubleClick = (emp: Employee) => {
    if (bulkMode || !canEdit) return;
    const empKey = `${emp.code}-${emp.num}`;
    setEditingName(empKey);
    setEditNameValue(emp.name);
  };

  const handleNameSave = (emp: Employee) => {
    if (onEmployeeUpdate && editNameValue !== emp.name) onEmployeeUpdate(emp, 'name', editNameValue);
    setEditingName(null);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent, emp: Employee) => {
    if (e.key === 'Enter') handleNameSave(emp);
    if (e.key === 'Escape') setEditingName(null);
  };

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayIndex = isCurrentMonth ? today.getDate() - 1 : -1;

  // Per-employee detailed counts
  const getEmployeeCounts = (empKey: string): Record<string, number> => {
    const empSchedule = currentSchedule[empKey] || [];
    const c: Record<string, number> = { D6: 0, D9: 0, M: 0, E: 0, N: 0, '#': 0, leave: 0, work: 0, off: 0 };
    empSchedule.forEach(cell => {
      if (!cell || !cell.shift) return;
      const s = cell.shift;
      if (s === 'D6' || s === 'D6/반' || s === 'D6/반반') c.D6++;
      else if (s === 'D9' || s === 'D9/반' || s === 'D9/반반' || s === 'D9/단') c.D9++;
      else if (s === 'M' || s === 'M/반' || s === 'M/반반') c.M++;
      else if (s === 'E' || s === 'E/반' || s === 'E/반반') c.E++;
      else if (s === 'N' || s === 'N/반' || s === 'N/반반') c.N++;
      else if (s === '파견') c.D9++;
      if (s === '#') { c['#']++; c.off++; }
      else if (s.startsWith('#(')) { c.leave++; c.off++; }
      else { c.work++; }
    });
    return c;
  };

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

  // Precompute all employee counts for summary panel
  const allCounts = branchEmployees.map(emp => ({
    emp,
    counts: getEmployeeCounts(`${emp.code}-${emp.num}`),
  }));
  const totals: Record<string, number> = {};
  summaryCols.forEach(col => {
    totals[col.key] = allCounts.reduce((sum, { counts }) => sum + (counts[col.key] || 0), 0);
  });

  return (
    <>
      {/* Bulk mode toolbar (only when can edit) */}
      {canEdit && <div className={`bg-white border-b px-4 py-2 flex items-center gap-3 shrink-0 transition-colors ${bulkMode ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200'}`}>
        <button
          onClick={() => { setBulkMode(!bulkMode); setSelectedCells(new Set()); }}
          className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
            bulkMode ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {bulkMode ? '일괄입력 ON' : '일괄입력'}
        </button>
        {bulkMode && (
          <>
            <span className="text-xs text-gray-500">근무유형:</span>
            <div className="flex gap-1 flex-wrap">
              {bulkShiftOptions.map(opt => {
                const style = getShiftStyle(opt.code);
                return (
                  <button
                    key={opt.code}
                    onClick={() => setBulkShift(opt.code)}
                    className={`px-2 py-1 text-[10px] font-bold rounded border-2 transition-all ${
                      bulkShift === opt.code
                        ? `${style.bg} ${style.text} border-current shadow-sm scale-110`
                        : `${style.bg} ${style.text} border-transparent opacity-60 hover:opacity-100`
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
              {canDelete && (
                <button
                  onClick={() => setBulkShift('DELETE')}
                  className={`px-2 py-1 text-[10px] font-bold rounded border-2 transition-all ${
                    bulkShift === 'DELETE'
                      ? 'bg-red-100 text-red-700 border-red-400 shadow-sm scale-110'
                      : 'bg-red-50 text-red-400 border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  🗑 삭제
                </button>
              )}
            </div>
            <span className="text-[10px] text-blue-500 ml-2">
              {bulkShift === 'DELETE' ? '삭제할 셀을 클릭하거나 드래그' : '셀을 클릭하거나 드래그하여 일괄 입력'}
            </span>
          </>
        )}
        {/* 복사/붙여넣기 안내 */}
        {!bulkMode && (
          <div className="ml-auto flex items-center gap-2 text-[10px] text-gray-500">
            {copiedRow ? (
              <>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                  📋 &quot;{copiedRow.empName}&quot; 복사됨
                </span>
                <span className="text-gray-500">다른 행의 📥 클릭하여 붙여넣기</span>
                <button onClick={() => setCopiedRow(null)} className="text-red-500 hover:underline">취소</button>
              </>
            ) : (
              <span className="text-gray-400">
                💡 이름 옆 <span className="bg-gray-100 px-1 rounded">📋</span> 복사, <span className="bg-purple-100 px-1 rounded">📄</span> 엑셀 붙여넣기
              </span>
            )}
          </div>
        )}
      </div>}

      {/* ===== MAIN SCHEDULE GRID ===== */}
      <div
        ref={gridContainerRef}
        className="schedule-grid overflow-auto flex-1 bg-white"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <table className={`schedule-table border-collapse text-xs min-w-max ${bulkMode ? 'select-none' : ''}`}>
          <thead>
            <tr>
              <th className="bg-slate-700 text-white px-1 py-1.5 text-center font-semibold w-8 border-r border-slate-600 sticky top-0 left-0 z-40">No</th>
              <th className="bg-slate-700 text-white px-2 py-1.5 text-left font-semibold w-20 border-r border-slate-600 sticky top-0 z-40" style={{left: '32px'}}>이름</th>
              <th className="bg-slate-700 text-white px-1 py-1.5 text-center font-semibold w-12 border-r border-slate-600 sticky top-0 z-40" style={{left: '112px'}}>직책</th>
              {days.map((day, i) => {
                const isSat = day.dow === 6;
                const isSun = day.dow === 0;
                const isHoliday = !!day.holiday;
                const isToday = i === todayIndex;
                return (
                  <th
                    key={`d${i}`}
                    ref={isToday ? todayColRef : undefined}
                    className={`px-0 py-1 text-center font-medium w-10 min-w-[40px] border-r sticky top-0 z-30 ${
                      isToday
                        ? 'bg-red-600 text-white border-red-700 relative'
                        : isHoliday || isSun
                        ? 'bg-red-800 text-red-100 border-slate-500'
                        : isSat
                        ? 'bg-blue-800 text-blue-100 border-slate-500'
                        : 'bg-slate-600 text-white border-slate-500'
                    }`}
                    title={isToday ? `오늘 ${day.date}일 (${day.dowLabel})${day.holiday ? ' - ' + day.holiday : ''}` : (day.holiday || '')}
                  >
                    {isToday && (
                      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[7px] font-black px-1.5 py-px rounded-b leading-tight shadow-sm">
                        TODAY
                      </div>
                    )}
                    <div className="text-[10px] leading-tight mt-0.5">
                      {day.holiday ? (
                        <span className={isToday ? 'text-white font-bold' : 'text-yellow-300'}>{day.dowLabel}</span>
                      ) : (
                        <span className={isToday ? 'font-bold' : ''}>{day.dowLabel}</span>
                      )}
                    </div>
                    <div className={`font-bold ${isToday ? 'text-lg leading-none' : ''}`}>{day.date}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* 공휴일 행 */}
            <tr className="bg-red-50/70">
              <td className="bg-red-50 border-r border-b border-gray-200 sticky left-0 z-20"></td>
              <td className="bg-red-50 border-r border-b border-gray-200 px-2 py-1 text-red-500 font-semibold text-[10px] sticky z-20" style={{left: '32px'}}>공휴일</td>
              <td className="bg-red-50 border-r border-b border-gray-200 sticky z-20" style={{left: '112px'}}></td>
              {days.map((day, i) => {
                const isToday = i === todayIndex;
                return (
                  <td key={i} className={`border-r border-b border-gray-200 px-0 py-0.5 text-center ${
                    isToday ? 'bg-red-100' : day.holiday || day.dow === 0 ? 'bg-red-50' : day.dow === 6 ? 'bg-blue-50/50' : 'bg-red-50/30'
                  }`}>
                    {day.holiday && <div className="text-[7px] text-red-500 font-bold leading-tight">{day.holiday}</div>}
                  </td>
                );
              })}
            </tr>
            {/* MEMO row - editable */}
            <tr className="bg-yellow-100 border-y-2 border-yellow-300">
              <td className="bg-yellow-100 border-r border-b border-gray-200 sticky left-0 z-20"></td>
              <td className="bg-yellow-200 border-r border-b border-gray-200 px-2 py-1.5 text-yellow-800 font-bold text-[11px] sticky z-20" style={{left: '32px'}}>📝 MEMO</td>
              <td className="bg-yellow-200 border-r border-b border-gray-200 sticky z-20" style={{left: '112px'}}></td>
              {days.map((day, i) => {
                const isToday = i === todayIndex;
                const memoKey = `${branchCode}-${month}-${i}`;
                const memoVal = dayMemos[memoKey] || '';
                const isEditingMemo = editingMemoIdx === i;
                return (
                  <td key={i} className={`border-r border-b border-gray-200 px-0 py-0 text-center text-[10px] ${
                    isToday ? 'bg-red-100' : day.holiday || day.dow === 0 ? 'bg-red-50/50' : day.dow === 6 ? 'bg-blue-50/50' : 'bg-yellow-50'
                  }`}
                  onClick={() => {
                    setEditingMemoIdx(i); setEditingMemoValue(memoVal);
                  }}
                  >
                    {isEditingMemo ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingMemoValue}
                        onChange={e => setEditingMemoValue(e.target.value)}
                        onBlur={() => { saveDayMemo(i, editingMemoValue); setEditingMemoIdx(null); }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { saveDayMemo(i, editingMemoValue); setEditingMemoIdx(null); }
                          if (e.key === 'Escape') setEditingMemoIdx(null);
                        }}
                        className="w-full px-0.5 py-0 text-[9px] border-0 bg-yellow-100 focus:outline-none focus:bg-yellow-200 text-center"
                      />
                    ) : (
                      memoVal && <div className="text-[8px] text-yellow-700 font-medium truncate px-0.5" title={memoVal}>{memoVal}</div>
                    )}
                  </td>
                );
              })}
            </tr>
            {/* Employee rows */}
            {branchEmployees.map((emp, empIdx) => {
              const empKey = `${emp.code}-${emp.num}`;
              const empSchedule = currentSchedule[empKey] || [];
              const isEditing = editingName === empKey;
              const rowBg = empIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';
              const cellBg = empIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50';

              return (
                <tr key={empKey} className={`${rowBg} hover:bg-blue-50/30`}>
                  <td className={`${cellBg} border-r border-b border-gray-200 text-center text-gray-400 font-mono sticky left-0 z-10`}>{emp.num}</td>
                  <td
                    className={`${cellBg} border-r border-b border-gray-200 px-2 py-1.5 font-medium text-gray-800 whitespace-nowrap group sticky z-10`}
                    style={{left: '32px'}}
                    onDoubleClick={() => handleNameDoubleClick(emp)}
                    title="더블클릭하여 이름 수정"
                  >
                    {isEditing ? (
                      <input autoFocus type="text" value={editNameValue}
                        onChange={e => setEditNameValue(e.target.value)}
                        onBlur={() => handleNameSave(emp)}
                        onKeyDown={e => handleNameKeyDown(e, emp)}
                        className="w-full px-1 py-0 text-xs border border-blue-400 rounded focus:outline-none bg-blue-50"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className={emp.name ? '' : 'text-gray-300 italic'}>{emp.name || '(미정)'}</span>
                        {canEdit && emp.name && (
                          <div className="ml-auto flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopyRow(emp); }}
                              className={`text-[11px] px-1.5 py-0.5 rounded border transition-all ${
                                copiedRow?.empName === emp.name
                                  ? 'bg-green-500 border-green-600 text-white shadow-sm'
                                  : 'bg-blue-50 border-blue-300 hover:bg-blue-100 text-blue-700'
                              }`}
                              title="이 행 스케줄 복사"
                            >
                              📋
                            </button>
                            {copiedRow && copiedRow.empName !== emp.name && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handlePasteRow(emp); }}
                                className="text-[11px] px-1.5 py-0.5 rounded border border-orange-400 bg-orange-100 hover:bg-orange-200 text-orange-700 animate-pulse"
                                title={`"${copiedRow.empName}" 스케줄을 여기에 붙여넣기`}
                              >
                                📥
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePasteFromClipboard(emp, 0); }}
                              className="text-[11px] px-1.5 py-0.5 rounded border border-purple-300 bg-purple-50 hover:bg-purple-200 text-purple-700"
                              title="엑셀/구글시트에서 복사한 내용 붙여넣기"
                            >
                              📄
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className={`${cellBg} border-r border-b border-gray-200 text-center py-1.5 sticky z-10`} style={{left: '112px'}}>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      emp.role === 'HM' ? 'bg-indigo-100 text-indigo-700' : emp.role === 'Lead' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'
                    }`}>{roleLabel(emp.role)}</span>
                  </td>
                  {days.map((day, dayIdx) => {
                    const cell = empSchedule[dayIdx];
                    const isToday = dayIdx === todayIndex;
                    const todayCls = isToday ? 'bg-red-50 border-l-[3px] border-r-[3px] border-red-400' : '';

                    if (!cell) return (
                      <td key={dayIdx} className={`border-r border-b border-gray-200 w-10 h-8 ${todayCls}`}
                        onClick={() => handleCellClick(emp, dayIdx)}
                        onMouseDown={() => handleCellMouseDown(emp, dayIdx)}
                        onMouseEnter={() => handleCellMouseEnter(emp, dayIdx)}
                      ></td>
                    );

                    const style = getShiftStyle(cell.shift);
                    const isSat = day.dow === 6;
                    const isSun = day.dow === 0;
                    const isHoliday = !!day.holiday;
                    const hasIndicator = cell.leaveRequest || cell.kakaoT;
                    const hasMemo = cell.memo.length > 0;

                    let bgOverride = '';
                    if (!isToday) {
                      if (isHoliday || isSun) bgOverride = 'bg-red-50/40';
                      else if (isSat) bgOverride = 'bg-blue-50/40';
                    }

                    return (
                      <td key={dayIdx}
                        className={`border-r border-b border-gray-200 p-0 relative ${isToday ? todayCls : bgOverride} ${bulkMode ? 'cursor-crosshair' : 'cursor-pointer'}`}
                        onClick={() => !isDragging && handleCellClick(emp, dayIdx)}
                        onMouseDown={(e) => { e.preventDefault(); handleCellMouseDown(emp, dayIdx); }}
                        onMouseEnter={() => handleCellMouseEnter(emp, dayIdx)}
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
                          {hasMemo && <div className="absolute top-0 right-0.5 text-[8px] text-red-400">*</div>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* Daily totals row - 하단 고정 */}
            <tr className="bg-slate-100 font-semibold">
              <td className="bg-slate-100 border-r border-b border-gray-300 sticky bottom-0 left-0 z-30"></td>
              <td className="bg-slate-100 border-r border-b border-gray-300 sticky bottom-0 z-30" style={{left: '32px'}}></td>
              <td className="bg-slate-100 border-r border-b border-gray-300 px-2 py-1.5 text-xs text-slate-600 text-right sticky bottom-0 z-30" style={{left: '112px'}}>일별 합계</td>
              {days.map((day, dayIdx) => {
                let dayWork = 0, dayOff = 0;
                branchEmployees.forEach(emp => {
                  const empKey = `${emp.code}-${emp.num}`;
                  const cell = currentSchedule[empKey]?.[dayIdx];
                  if (cell && cell.shift) {
                    if (cell.shift === '#' || cell.shift.startsWith('#(')) dayOff++;
                    else dayWork++;
                  }
                });
                const isToday = dayIdx === todayIndex;
                const isHoliday = !!day.holiday;
                const isSun = day.dow === 0;
                const isSat = day.dow === 6;
                let bg = isToday ? 'bg-red-100' : isHoliday || isSun ? 'bg-red-50/30' : isSat ? 'bg-blue-50/30' : 'bg-slate-100';
                return (
                  <td key={dayIdx} className={`border-r border-b border-gray-300 text-center text-[9px] ${bg} px-0 py-1 sticky bottom-0 z-20 ${isToday ? 'border-l-[3px] border-r-[3px] border-red-400' : ''}`}>
                    <div className="text-blue-600">{dayWork}</div>
                    <div className="text-gray-400">{dayOff}</div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ===== MONTHLY SUMMARY PANEL (아래쪽 집계) ===== */}
      <div className="shrink-0 border-t border-gray-200 bg-white">
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="w-full flex items-center justify-between px-3 py-1 text-[10px] md:text-xs text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-1"><span className={`inline-block transition-transform text-[8px] ${showSummary ? 'rotate-90' : ''}`}>▶</span>📊 {month}월 근무유형별 집계</span>
          <span className="text-[9px] text-gray-400">{showSummary ? '접기' : '펼치기'}</span>
        </button>
        {showSummary && (
          <div className="overflow-auto max-h-[240px] px-2 pb-2">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="bg-slate-700 text-white px-2 py-1.5 text-center font-semibold border-r border-slate-600 w-8 sticky top-0">No</th>
                  <th className="bg-slate-700 text-white px-2 py-1.5 text-left font-semibold border-r border-slate-600 sticky top-0">이름</th>
                  <th className="bg-slate-700 text-white px-2 py-1.5 text-center font-semibold border-r border-slate-600 w-12 sticky top-0">직책</th>
                  {summaryCols.map(col => (
                    <th key={col.key} className={`${col.hBg} text-white px-1 py-1.5 text-center font-bold border-r border-white/30 w-12 sticky top-0`}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allCounts.map(({ emp, counts }, idx) => (
                  <tr key={`${emp.code}-${emp.num}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border-r border-b border-gray-200 text-center text-gray-400 font-mono px-1 py-1">{emp.num}</td>
                    <td className="border-r border-b border-gray-200 px-2 py-1 font-medium text-gray-800">{emp.name || '(미정)'}</td>
                    <td className="border-r border-b border-gray-200 text-center py-1">
                      <span className={`text-[10px] font-semibold px-1 py-0.5 rounded ${
                        emp.role === 'HM' ? 'bg-indigo-100 text-indigo-700' : emp.role === 'Lead' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'
                      }`}>{roleLabel(emp.role)}</span>
                    </td>
                    {summaryCols.map(col => (
                      <td key={col.key} className={`${col.bg} ${col.text} border-r border-b border-gray-200 text-center font-bold py-1`}>
                        {counts[col.key] || 0}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Totals */}
                <tr className="bg-slate-200 font-bold">
                  <td colSpan={3} className="border-r border-b border-gray-300 px-2 py-1.5 text-right text-slate-700">합계</td>
                  {summaryCols.map(col => (
                    <td key={col.key} className={`${col.bg} ${col.text} border-r border-b border-gray-300 text-center py-1.5 text-sm`}>
                      {totals[col.key] || 0}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
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
          <span key={item.label} className={`${item.bg} ${item.text} px-1.5 py-0.5 rounded font-bold`}>{item.label}</span>
        ))}
        <span className="text-gray-300">|</span>
        <span className="text-gray-400 font-medium">휴무:</span>
        {[
          { label: '#', bg: 'bg-gray-100', text: 'text-gray-500' },
          { label: '연차', bg: 'bg-pink-100', text: 'text-pink-700' },
          { label: '대체', bg: 'bg-slate-200', text: 'text-slate-600' },
          { label: '병가', bg: 'bg-red-100', text: 'text-red-600' },
        ].map(item => (
          <span key={item.label} className={`${item.bg} ${item.text} px-1.5 py-0.5 rounded font-bold`}>{item.label}</span>
        ))}
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1"><span className="dot-leave inline-block" /> 연차상신</span>
        <span className="flex items-center gap-1"><span className="dot-taxi inline-block" /> 카카오T</span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-red-50 border border-red-200 rounded-sm" /> 공휴일</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-red-100 border-2 border-red-400 rounded-sm" /> 오늘</span>
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
          onDelete={handleDelete}
          canEditLeave={canEditLeave}
          canDelete={canDelete}
        />
      )}
    </>
  );
}
