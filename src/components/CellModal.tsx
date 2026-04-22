'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CellData, ShiftType, shiftCategories, shiftDescriptions, getShiftStyle } from '@/data/mockData';

interface CellModalProps {
  isOpen: boolean;
  onClose: () => void;
  cellData: CellData;
  employeeName: string;
  date: number;
  month: number;
  dowLabel: string;
  holiday?: string;
  onSave: (data: CellData) => void;
  onDelete?: () => void;
  canEditLeave?: boolean;
  canDelete?: boolean;
}

export default function CellModal({
  isOpen,
  onClose,
  cellData,
  employeeName,
  date,
  month,
  dowLabel,
  holiday,
  onSave,
  onDelete,
  canEditLeave = true,
  canDelete = false,
}: CellModalProps) {
  const [shift, setShift] = useState<ShiftType>(cellData.shift);
  const [leaveRequest, setLeaveRequest] = useState(cellData.leaveRequest);
  const [kakaoT, setKakaoT] = useState(cellData.kakaoT);
  const [memo, setMemo] = useState(cellData.memo);
  const [activeTab, setActiveTab] = useState<'regular' | 'half' | 'quarter' | 'off' | 'special'>('regular');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShift(cellData.shift);
    setLeaveRequest(cellData.leaveRequest);
    setKakaoT(cellData.kakaoT);
    setMemo(cellData.memo);
    // Set active tab based on current shift
    if (cellData.shift) {
      if (cellData.shift.includes('반반')) setActiveTab('quarter');
      else if (cellData.shift.includes('/반') || cellData.shift === 'D9/단') setActiveTab('half');
      else if (cellData.shift.startsWith('#')) setActiveTab('off');
      else if (cellData.shift === '파견') setActiveTab('special');
      else setActiveTab('regular');
    }
  }, [cellData]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ shift, leaveRequest, kakaoT, memo });
    onClose();
  };

  const tabs = [
    { key: 'regular' as const, label: '정규근무' },
    { key: 'half' as const, label: '반차' },
    { key: 'quarter' as const, label: '반반차' },
    { key: 'off' as const, label: '휴무/연차' },
    { key: 'special' as const, label: '기타' },
  ];

  const currentShifts = shiftCategories[activeTab];

  return (
    <div
      className="modal-backdrop fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="modal-content bg-white rounded-xl shadow-2xl w-[360px] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-700 text-white px-4 py-3 flex items-center justify-between">
          <div>
            <span className="font-bold">{employeeName || '(미정)'}</span>
            <span className="text-slate-300 text-sm ml-2">
              {month}/{date} ({dowLabel})
            </span>
            {holiday && (
              <span className="ml-2 text-xs bg-red-500/80 px-1.5 py-0.5 rounded">{holiday}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Shift category tabs */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              근무 유형
            </label>
            <div className="flex gap-1 mb-2">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-2 py-1 text-[10px] font-semibold rounded transition-colors ${
                    activeTab === tab.key
                      ? 'bg-slate-700 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className={`grid gap-1.5 ${activeTab === 'off' ? 'grid-cols-4' : 'grid-cols-5'}`}>
              {currentShifts.map(s => {
                const sStyle = getShiftStyle(s.code);
                return (
                  <button
                    key={s.code}
                    onClick={() => setShift(s.code)}
                    title={s.desc}
                    className={`px-1 py-1.5 text-[10px] font-bold rounded border-2 transition-all ${
                      shift === s.code
                        ? `${sStyle.bg} ${sStyle.text} border-current shadow-sm`
                        : `${sStyle.bg} ${sStyle.text} border-transparent opacity-60 hover:opacity-100`
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
              {/* Clear button */}
              <button
                onClick={() => setShift('' as ShiftType)}
                className={`px-1 py-1.5 text-[10px] font-bold rounded border-2 transition-all ${
                  shift === ''
                    ? 'bg-white text-gray-600 border-gray-400 shadow-sm'
                    : 'bg-gray-50 text-gray-400 border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                지우기
              </button>
            </div>
            {shift && (
              <p className="text-xs text-gray-400 mt-1">{shiftDescriptions[shift] || ''}</p>
            )}
          </div>

          {/* Leave request (Admin only) */}
          <div className={`flex items-center justify-between py-2 border-t border-gray-100 ${!canEditLeave ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-400"></div>
              <span className="text-sm font-medium text-gray-700">연차상신</span>
              {!canEditLeave && <span className="text-[9px] text-gray-400">(Master 전용)</span>}
            </div>
            <label className={`relative inline-flex items-center ${canEditLeave ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
              <input
                type="checkbox"
                checked={leaveRequest}
                onChange={e => canEditLeave && setLeaveRequest(e.target.checked)}
                disabled={!canEditLeave}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-400"></div>
            </label>
          </div>

          {/* KakaoT (Admin only) */}
          <div className={`flex items-center justify-between py-2 border-t border-gray-100 ${!canEditLeave ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-400"></div>
              <span className="text-sm font-medium text-gray-700">카카오T</span>
              {!canEditLeave && <span className="text-[9px] text-gray-400">(Master 전용)</span>}
            </div>
            <label className={`relative inline-flex items-center ${canEditLeave ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
              <input
                type="checkbox"
                checked={kakaoT}
                onChange={e => canEditLeave && setKakaoT(e.target.checked)}
                disabled={!canEditLeave}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-400"></div>
            </label>
          </div>

          {/* Memo */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              메모
            </label>
            <input
              type="text"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="메모를 입력하세요..."
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            {canDelete && cellData.shift && (
              <button
                onClick={() => { if (onDelete) { onDelete(); onClose(); } }}
                className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
              >
                삭제
              </button>
            )}
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-600 transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
