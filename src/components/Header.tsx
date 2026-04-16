'use client';

import React from 'react';

interface HeaderProps {
  branchName: string;
  branchCode: string;
  month: number;
  year: number;
  workingCount: number;
  offCount: number;
  totalCount: number;
  branchTo?: number;
  isEditPeriod: boolean;
  onManageEmployees?: () => void;
}

export default function Header({
  branchName,
  branchCode,
  month,
  year,
  workingCount,
  offCount,
  totalCount,
  branchTo,
  isEditPeriod,
  onManageEmployees,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-gray-800">
          <span className="text-gray-400 text-sm mr-1">{branchCode}</span>
          {branchName}
        </h1>
        <span className="text-sm text-gray-500">
          {year}년 {month}월 스케줄
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Summary stats */}
        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium">
            근무 {workingCount}명
          </span>
          <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium">
            휴무 {offCount}명
          </span>
          <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">
            총 {totalCount}명
            {branchTo && (
              <span className="text-slate-400 ml-1">/ TO {branchTo}</span>
            )}
          </span>
        </div>

        {/* Edit period indicator */}
        {isEditPeriod ? (
          <div className="px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
            편집 가능 기간: {month}/20~{month}/24
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-medium">
            조회 전용
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {onManageEmployees && (
            <button
              onClick={onManageEmployees}
              className="px-3 py-1.5 text-xs font-medium rounded bg-slate-700 text-white hover:bg-slate-600 transition-colors"
            >
              인원 관리
            </button>
          )}
          <button className="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
            아마란스 엑셀
          </button>
          <button className="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
            인원별 엑셀
          </button>
        </div>
      </div>
    </header>
  );
}
