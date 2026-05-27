'use client';

import React, { useState } from 'react';
import { CurrentUser } from '@/data/auth';
import { useHistory, undoLast } from '@/lib/historyStack';

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
  canEdit: boolean;
  isHMBranch: boolean; // 현재 지점의 HM인지
  hasTempGrant?: boolean; // 임시 편집권 활성 여부
  currentUser: CurrentUser | null;
  onManageEmployees?: () => void;
  empCodeMissingCount?: number; // 사번 누락 직원 수 (전 지점 통합)
  onAdminPanel?: () => void;
  onTrainingDash?: () => void;
  onMonthlyRoster?: () => void;
  onChangeLog?: () => void;
  onMasterLogin?: () => void;
  onLogout: () => void;
  onDownloadAmaranth?: () => void;
  onDownloadAllAmaranth?: () => void;
}

export default function Header({
  branchName, branchCode, month, year,
  workingCount, offCount, totalCount, branchTo,
  isEditPeriod, canEdit, isHMBranch, hasTempGrant, currentUser,
  onManageEmployees, empCodeMissingCount = 0, onAdminPanel, onTrainingDash, onMonthlyRoster, onChangeLog, onMasterLogin, onLogout,
  onDownloadAmaranth, onDownloadAllAmaranth,
}: HeaderProps) {
  const role = currentUser?.role || 'viewer';
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const { size: historySize, last: lastHistory } = useHistory();
  const [undoBusy, setUndoBusy] = useState(false);
  const handleUndo = async () => {
    if (undoBusy || historySize === 0) return;
    setUndoBusy(true);
    const e = await undoLast();
    setUndoBusy(false);
    if (e) {
      // 간단한 토스트 대신 console.log; 추후 토스트 추가 가능
      console.log('[Undo]', e.label);
    }
  };
  // 키보드: Cmd/Ctrl+Z
  React.useEffect(() => {
    const fn = (ev: KeyboardEvent) => {
      const isUndo = (ev.metaKey || ev.ctrlKey) && !ev.shiftKey && ev.key.toLowerCase() === 'z';
      if (!isUndo) return;
      // 입력 필드에서는 기본 undo 동작 우선
      const t = ev.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || (t as any).isContentEditable)) return;
      ev.preventDefault();
      handleUndo();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historySize, undoBusy]);
  const roleBadge = role === 'master'
    ? { label: 'Master', cls: 'bg-red-100 text-red-700' }
    : role === 'editor'
    ? { label: 'Editor', cls: 'bg-blue-100 text-blue-700' }
    : { label: 'Viewer', cls: 'bg-gray-100 text-gray-500' };

  return (
    <header className="bg-white border-b border-gray-200 px-3 md:px-6 py-2 md:py-3 flex flex-wrap items-center justify-between gap-2 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4">
        <h1 className="text-sm md:text-lg font-bold text-gray-800">
          <span className="text-gray-400 text-xs md:text-sm mr-1">{branchCode}</span>
          {branchName}
        </h1>
        <span className="text-xs md:text-sm text-gray-500">{year}년 {month}월</span>
      </div>

      <div className="flex items-center gap-2 md:gap-3 flex-wrap">
        {/* Stats - compact on mobile */}
        <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
          <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-blue-50 text-blue-700 font-medium">근무 {workingCount}</span>
          <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-gray-100 text-gray-600 font-medium">휴무 {offCount}</span>
          <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-slate-100 text-slate-700 font-medium">
            총 {totalCount}{branchTo ? <span className="text-slate-400 ml-1 hidden sm:inline">/ TO {branchTo}</span> : ''}
          </span>
        </div>

        {canEdit ? (
          <div className="flex items-center gap-1">
            <div className="px-2 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-[10px] md:text-xs font-medium">편집 가능</div>
            {isHMBranch && currentUser?.role !== 'master' && (
              <div className="px-2 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] md:text-xs font-medium">HM</div>
            )}
            {hasTempGrant && currentUser?.role !== 'master' && (
              <div className="px-2 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-700 text-[10px] md:text-xs font-medium" title="임시 편집권한 활성">🕐 임시권</div>
            )}
          </div>
        ) : isEditPeriod && isHMBranch ? (
          <div className="px-2 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-[10px] md:text-xs font-medium">편집 가능 (HM)</div>
        ) : isEditPeriod ? (
          <div className="px-2 py-1 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-[10px] md:text-xs font-medium">편집기간 (권한 없음)</div>
        ) : (
          <div className="px-2 py-1 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-[10px] md:text-xs font-medium">조회 전용</div>
        )}

        {/* Undo button */}
        <button
          onClick={handleUndo}
          disabled={historySize === 0 || undoBusy}
          title={historySize === 0 ? '되돌릴 작업 없음' : `되돌리기: ${lastHistory?.label || ''} (${historySize}단계)\nCmd/Ctrl+Z`}
          className={`px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-medium rounded flex items-center gap-1 transition-colors ${
            historySize === 0
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          <span>↩ 되돌리기</span>
          {historySize > 0 && (
            <span className="bg-white/30 px-1 rounded text-[10px] font-bold">{historySize}</span>
          )}
        </button>

        {/* Admin buttons */}
        <div className="flex gap-1 md:gap-2">
          {onManageEmployees && (
            <button
              onClick={onManageEmployees}
              className="relative px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-medium rounded bg-slate-700 text-white hover:bg-slate-600"
              title={empCodeMissingCount > 0 ? `사번 누락 ${empCodeMissingCount}명 — 클릭해서 입력` : undefined}
            >
              인원 관리
              {empCodeMissingCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-1 py-0 text-[9px] font-bold rounded-full bg-red-500 text-white min-w-[14px] h-[14px]">
                  ⚠️{empCodeMissingCount}
                </span>
              )}
            </button>
          )}
          {onAdminPanel && (
            <button onClick={onAdminPanel} className="px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-medium rounded bg-red-600 text-white hover:bg-red-500">권한 관리</button>
          )}
          {onTrainingDash && (
            <button onClick={onTrainingDash} className="px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-medium rounded bg-indigo-600 text-white hover:bg-indigo-500">💪 직군</button>
          )}
          {onMonthlyRoster && (
            <button onClick={onMonthlyRoster} className="px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-medium rounded bg-purple-600 text-white hover:bg-purple-500">📅 월별 직군</button>
          )}
          {onChangeLog && (
            <button onClick={onChangeLog} className="px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-medium rounded bg-slate-600 text-white hover:bg-slate-700">📜 이력</button>
          )}
          {/* Amaranth download - Master only */}
          {onDownloadAmaranth && (
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-medium rounded bg-emerald-600 text-white hover:bg-emerald-500"
              >
                📥 아마란스
              </button>
              {showDownloadMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px]">
                    <button
                      onClick={() => { onDownloadAmaranth(); setShowDownloadMenu(false); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700"
                    >
                      📄 현재 지점 다운로드
                      <div className="text-[10px] text-gray-400">{branchCode}_{branchName} {month}월</div>
                    </button>
                    {onDownloadAllAmaranth && (
                      <button
                        onClick={() => { onDownloadAllAmaranth(); setShowDownloadMenu(false); }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700 border-t border-gray-100"
                      >
                        📋 전체 지점 다운로드
                        <div className="text-[10px] text-gray-400">29개 지점 통합 {month}월</div>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-1 md:gap-2 pl-2 border-l border-gray-200">
          <span className="text-[10px] md:text-xs font-medium text-gray-700">{currentUser?.name || ''}</span>
          <span className={`text-[9px] md:text-[10px] font-semibold px-1 md:px-1.5 py-0.5 rounded ${roleBadge.cls}`}>{roleBadge.label}</span>
          {role !== 'master' && onMasterLogin && (
            <button onClick={onMasterLogin} className="text-[9px] md:text-[10px] text-blue-500 hover:text-blue-700 font-medium">마스터</button>
          )}
          <button onClick={onLogout} className="text-[9px] md:text-[10px] text-gray-400 hover:text-red-500">로그아웃</button>
        </div>
      </div>
    </header>
  );
}
