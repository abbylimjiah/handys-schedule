'use client';

import React, { useState } from 'react';
import { Employee, branches, CellData } from '@/data/mockData';
import { loadSchedule } from '@/lib/scheduleApi';
import { downloadAmaranthExcel, downloadAllBranchesAmaranth } from '@/data/amaranth';

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
  const [scope, setScope] = useState<'branch' | 'all'>('branch');
  const [selBranch, setSelBranch] = useState(defaultBranch);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  if (!isOpen) return null;

  const handleDownload = async () => {
    setLoading(true);
    try {
      if (scope === 'branch') {
        setProgress(`${selBranch} 지점 ${year}년 ${month}월 스케줄 불러오는 중...`);
        const sched = (await loadSchedule(selBranch, year, month)) || {};
        const branchName = branches.find(b => b.code === selBranch)?.name || '';
        downloadAmaranthExcel(selBranch, branchName, month, year, employees, sched);
      } else {
        // 전체 지점: 모든 지점 스케줄 미리 로드
        const branchCodes = Array.from(new Set(employees.filter(e => e.name.trim()).map(e => e.code)));
        const cache: Record<string, Record<string, CellData[]>> = {};
        for (let i = 0; i < branchCodes.length; i++) {
          const code = branchCodes[i];
          setProgress(`(${i+1}/${branchCodes.length}) ${code} 불러오는 중...`);
          cache[code] = (await loadSchedule(code, year, month)) || {};
        }
        setProgress('CSV 생성 중...');
        downloadAllBranchesAmaranth(month, year, employees, (code) => cache[code] || {});
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
          <span className="font-bold">📥 아마란스 엑셀 다운로드</span>
          <button onClick={onClose} className="text-slate-300 hover:text-white text-lg">&times;</button>
        </div>
        <div className="p-5 space-y-4">
          {/* Year/Month */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">년/월 선택</label>
            <div className="flex gap-2">
              <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm">
                {yearOptions.map(y => <option key={y} value={y}>{y}년</option>)}
              </select>
              <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm">
                {monthOptions.map(m => <option key={m} value={m}>{m}월</option>)}
              </select>
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">범위</label>
            <div className="flex gap-2">
              <button
                onClick={() => setScope('branch')}
                className={`flex-1 px-3 py-2 text-sm rounded border-2 ${scope === 'branch' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-gray-300 text-gray-700'}`}
              >
                이 지점만
              </button>
              <button
                onClick={() => setScope('all')}
                className={`flex-1 px-3 py-2 text-sm rounded border-2 ${scope === 'all' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-gray-300 text-gray-700'}`}
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
              className="flex-1 px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold disabled:bg-gray-400"
            >
              {loading ? '처리 중...' : '📥 다운로드'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
