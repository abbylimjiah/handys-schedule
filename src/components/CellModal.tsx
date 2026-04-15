'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CellData, ShiftType, shiftTypes, shiftDescriptions, getShiftStyle } from '@/data/mockData';

interface CellModalProps {
  isOpen: boolean;
  onClose: () => void;
  cellData: CellData;
  employeeName: string;
  date: number;
  month: number;
  dowLabel: string;
  onSave: (data: CellData) => void;
}

export default function CellModal({
  isOpen,
  onClose,
  cellData,
  employeeName,
  date,
  month,
  dowLabel,
  onSave,
}: CellModalProps) {
  const [shift, setShift] = useState<ShiftType>(cellData.shift);
  const [leaveRequest, setLeaveRequest] = useState(cellData.leaveRequest);
  const [kakaoT, setKakaoT] = useState(cellData.kakaoT);
  const [memo, setMemo] = useState(cellData.memo);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShift(cellData.shift);
    setLeaveRequest(cellData.leaveRequest);
    setKakaoT(cellData.kakaoT);
    setMemo(cellData.memo);
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

  const style = getShiftStyle(shift);

  return (
    <div
      className="modal-backdrop fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="modal-content bg-white rounded-xl shadow-2xl w-80 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-700 text-white px-4 py-3 flex items-center justify-between">
          <div>
            <span className="font-bold">{employeeName}</span>
            <span className="text-slate-300 text-sm ml-2">
              {month}/{date} ({dowLabel})
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Shift selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              근무 유형
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {shiftTypes.filter(s => s !== '').map(s => {
                const sStyle = getShiftStyle(s);
                return (
                  <button
                    key={s}
                    onClick={() => setShift(s)}
                    className={`px-1 py-1.5 text-xs font-bold rounded border-2 transition-all ${
                      shift === s
                        ? `${sStyle.bg} ${sStyle.text} border-current shadow-sm`
                        : `${sStyle.bg} ${sStyle.text} border-transparent opacity-60 hover:opacity-100`
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {shift && (
              <p className="text-xs text-gray-400 mt-1">{shiftDescriptions[shift] || ''}</p>
            )}
          </div>

          {/* Leave request */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-400"></div>
              <span className="text-sm font-medium text-gray-700">연차상신</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={leaveRequest}
                onChange={e => setLeaveRequest(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-400"></div>
            </label>
          </div>

          {/* KakaoT */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-400"></div>
              <span className="text-sm font-medium text-gray-700">카카오T</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={kakaoT}
                onChange={e => setKakaoT(e.target.checked)}
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

          {/* Save button */}
          <button
            onClick={handleSave}
            className="w-full py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-600 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
