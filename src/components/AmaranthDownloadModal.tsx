'use client';

import React, { useState } from 'react';
import { Employee, branches, CellData } from '@/data/mockData';
import { loadSchedule } from '@/lib/scheduleApi';
import {
  downloadAmaranthExcel,
  downloadAllBranchesAmaranth,
  downloadRawTextExcel,
  downloadAllRawTextExcel,
  downloadAmaranthExcelMulti,
  downloadAllBranchesAmaranthMulti,
  downloadRawTextExcelMulti,
  downloadAllRawTextExcelMulti,
} from '@/data/amaranth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  defaultYear: number;
  defaultMonth: number;
  defaultBranch: string;
}

export default function AmaranthDownloadModal({ isOpen, onClose, employees, defaultYear, defaultMonth, defaultBranch }: Props) {
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [rangeMode, setRangeMode] = useState<'single' | 'range'>('single');
  const [startMonth, setStartMonth] = useState(defaultMonth);
  const [endMonth, setEndMonth] = useState(defaultMonth);
  const [scope, setScope] = useState<'branch' | 'all'>('branch');
  const [format, setFormat] = useState<'amaranth' | 'text'>('text');
  const [selBranch, setSelBranch] = useState(defaultBranch);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  if (!isOpen) return null;

  // 월 범위 → 월 배열 ([1,2,3,...])
  const getMonths = (): number[] => {
    if (rangeMode === 'single') return [month];
    const s = Math.min(startMonth, endMonth);
    const e = Math.max(startMonth, endMonth);
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const months = getMonths();
      const isMulti = months.length > 1;

      if (scope === 'branch') {
        const branchName = branches.find(b => b.code === selBranch)?.name || '';
        if (isMulti) {
          // 각 월별 스케줄 로드
          const scheduleByMonth: Record<number, Record<string, CellData[]>> = {};
          for (let i = 0; i < months.length; i++) {
            const m = months[i];
            setProgress(`(${i+1}/${months.length}) ${m}월 스케줄 불러오는 중...`);
            scheduleByMonth[m] = (await loadSchedule(selBranch, year, m)) || {};
          }
          setProgress('엑셀 생성 중...');
          if (format === 'amaranth') {
            downloadAmaranthExcelMulti(selBranch, branchName, months, year, employees, scheduleByMonth);
          } else {
            downloadRawTextExcelMulti(selBranch, branchName, months, year, employees, scheduleByMonth);
          }
        } else {
          setProgress(`${selBranch} 지점 ${year}년 ${month}월 스케줄 불러오는 중...`);
          const sched = (await loadSchedule(selBranch, year, month)) || {};
          if (format === 'amaranth') {
            downloadAmaranthExcel(selBranch, branchName, month, year, employees, sched);
          } else {
            downloadRawTextExcel(selBranch, branchName, month, year, employees, sched);
          }
        }
      } else {
        // 전체 지점
        const branchCodes = Array.from(new Set(employees.filter(e => e.name.trim()).map(e => e.code)));
        if (isMulti) {
          // (지점, 월) 조합으로 캐시
          const cache: Record<string, Record<number, Record<string, CellData[]>>> = {};
          const totalSteps = branchCodes.length * months.length;
          let step = 0;
          for (const code of branchCodes) {
            cache[code] = {};
            for (const m of months) {
              step++;
              setProgress(`(${step}/${totalSteps}) ${code} ${m}월 불러오는 중...`);
              cache[code][m] = (await loadSchedule(code, year, m)) || {};
            }
          }
          setProgress('엑셀 생성 중...');
          const getSched = (code: string, m: number) => cache[code]?.[m] || {};
          if (format === 'amaranth') {
            downloadAllBranchesAmaranthMulti(months, year, employees, getSched);
          } else {
            downloadAllRawTextExcelMulti(months, year, employees, getSched, branches);
          }
        } else {
          const cache: Record<string, Record<string, CellData[]>> = {};
          for (let i = 0; i < branchCodes.length; i++) {
            const code = branchCodes[i];
            setProgress(`(${i+1}/${branchCodes.length}) ${code} 불러오는 중...`);
            cache[code] = (await loadSchedule(code, year, month)) || {};
          }
          setProgress('엑셀 생성 중...');
          if (format === 'amaranth') {
            downloadAllBranchesAmaranth(month, year, employees, (code) => cache[code] || {});
          } else {
            downloadAllRawTextExcel(month, year, employees, (code) => cache[code] || {}, branches);
          }
        }
      }
      setProgress('완료!');
      setTimeout(() => { setLoading(false); setProgress(''); onClose(); }, 600);
    } catch (e) {
      console.error(e);
      alert('다운로드 실패: ' + (e as Error).message);
      setLoading(false);
      setProgress('');
    }
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const yearOptions = [2025, 2026, 2027];

  return (
    <div className="modal-backdrop fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="modal-content bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-slate-700 text-white px-4 py-3 flex items-center justify-between">
          <span className="font-bold">📥 스케줄 다운로드</span>
          <button onClick={onClose} className="text-slate-300 hover:text-white text-lg">&times;</button>
        </div>
        <div className="p-5 space-y-4">
          {/* Format */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">형식</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat('text')}
                className={`flex-1 px-3 py-2 text-sm rounded border-2 ${format === 'text' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                📋 텍스트 (D9, E, M)
              </button>
              <button
                onClick={() => setFormat('amaranth')}
                className={`flex-1 px-3 py-2 text-sm rounded border-2 ${format === 'amaranth' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                🔢 아마란스 (001, 002)
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5">
              {format === 'text'
                ? '✅ 사람이 보기 편한 형식 (D9, E, M, 연차 등)'
                : '⚙️ 아마란스 시스템 업로드용 코드 (근무 001=D9 / 002=E / 005=M / 006=D6 / 007=N · 휴무 004=주 / 008=야 / 009=중 / 010=주6 / 011=심야 · 단축 012=D9단 / 013=E단 / 014=M단 / 015=N단)'}
            </p>
          </div>

          {/* Year + Range Mode */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">년도 / 기간</label>
            <div className="flex gap-2 mb-2">
              <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm">
                {yearOptions.map(y => <option key={y} value={y}>{y}년</option>)}
              </select>
              <button
                onClick={() => setRangeMode('single')}
                className={`flex-1 px-3 py-2 text-sm rounded border-2 ${rangeMode === 'single' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                단일 월
              </button>
              <button
                onClick={() => setRangeMode('range')}
                className={`flex-1 px-3 py-2 text-sm rounded border-2 ${rangeMode === 'range' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                월 범위
              </button>
            </div>
            {rangeMode === 'single' ? (
              <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                {monthOptions.map(m => <option key={m} value={m}>{m}월</option>)}
              </select>
            ) : (
              <div className="flex gap-2 items-center">
                <select value={startMonth} onChange={e => setStartMonth(parseInt(e.target.value))} className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm">
                  {monthOptions.map(m => <option key={m} value={m}>{m}월</option>)}
                </select>
                <span className="text-gray-500 text-sm">~</span>
                <select value={endMonth} onChange={e => setEndMonth(parseInt(e.target.value))} className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm">
                  {monthOptions.map(m => <option key={m} value={m}>{m}월</option>)}
                </select>
              </div>
            )}
            {rangeMode === 'range' && (
              <p className="text-[10px] text-gray-500 mt-1.5">
                💡 한 엑셀 파일 안에 월별 시트(탭)로 분리됩니다. 예: <b>{Math.min(startMonth, endMonth)}월</b> ~ <b>{Math.max(startMonth, endMonth)}월</b> = {Math.abs(endMonth - startMonth) + 1}개 시트
              </p>
            )}
          </div>

          {/* Scope */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">범위</label>
            <div className="flex gap-2">
              <button
                onClick={() => setScope('branch')}
                className={`flex-1 px-3 py-2 text-sm rounded border-2 ${scope === 'branch' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                이 지점만
              </button>
              <button
                onClick={() => setScope('all')}
                className={`flex-1 px-3 py-2 text-sm rounded border-2 ${scope === 'all' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                전체 지점
              </button>
            </div>
          </div>

          {scope === 'branch' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">지점 선택</label>
              <select value={selBranch} onChange={e => setSelBranch(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                {branches.map(b => <option key={b.code} value={b.code}>{b.code} {b.name}</option>)}
              </select>
            </div>
          )}

          {progress && (
            <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded">
              {progress}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded font-semibold disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleDownload}
              disabled={loading}
              className={`flex-1 px-4 py-2 text-sm text-white rounded font-semibold disabled:bg-gray-400 ${format === 'text' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}
            >
              {loading ? '처리 중...' : '📥 다운로드'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
