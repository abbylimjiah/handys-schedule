'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { branches } from '@/data/mockData';
import { ChangeLog, ChangeLogKind, fetchRecentChanges, subscribeToChangeLogs } from '@/lib/changeLogApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultBranchCode?: string;
}

const KIND_LABEL: Record<ChangeLogKind, string> = {
  schedule: '스케줄',
  employee: '직원',
  memo: '메모',
  training: '직군',
};
const KIND_BADGE: Record<ChangeLogKind, string> = {
  schedule: 'bg-blue-100 text-blue-700',
  employee: 'bg-green-100 text-green-700',
  memo: 'bg-amber-100 text-amber-700',
  training: 'bg-purple-100 text-purple-700',
};
const ACTION_BADGE = (action: string) => {
  if (action.includes('되돌리기')) return 'bg-orange-100 text-orange-700';
  if (action === '저장') return 'bg-slate-100 text-slate-700';
  if (action === '추가') return 'bg-green-50 text-green-700';
  if (action === '삭제') return 'bg-rose-100 text-rose-700';
  return 'bg-slate-100 text-slate-700';
};

function formatTimeAgo(ts: string): string {
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return d.toLocaleDateString('ko-KR') + ' ' + d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function formatExact(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ChangeLogModal({ isOpen, onClose, defaultBranchCode }: Props) {
  const [logs, setLogs] = useState<ChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterKind, setFilterKind] = useState<string>('all');
  const [limit, setLimit] = useState(200);

  useEffect(() => {
    if (!isOpen) return;
    if (defaultBranchCode) setFilterBranch(defaultBranchCode);
  }, [isOpen, defaultBranchCode]);

  const loadLogs = async () => {
    setLoading(true);
    const data = await fetchRecentChanges({ limit });
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    loadLogs();
    const unsub = subscribeToChangeLogs(() => loadLogs());
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, limit]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (filterBranch !== 'all' && l.branch_code !== filterBranch) return false;
      if (filterUser !== 'all' && l.user_name !== filterUser) return false;
      if (filterKind !== 'all' && l.kind !== filterKind) return false;
      return true;
    });
  }, [logs, filterBranch, filterUser, filterKind]);

  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => l.user_name && set.add(l.user_name));
    return Array.from(set).sort();
  }, [logs]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="modal-content bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-slate-700 text-white px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold">📜 변경 이력 (감사 로그)</span>
            <span className="text-slate-300 text-xs">누가 / 언제 / 어디 / 뭘 바꿨는지</span>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white text-lg">&times;</button>
        </div>

        {/* 필터 */}
        <div className="px-5 py-3 border-b bg-gray-50 flex flex-wrap items-center gap-3 text-xs">
          <select
            value={filterBranch}
            onChange={e => setFilterBranch(e.target.value)}
            className="px-2 py-1 border border-gray-200 rounded bg-white"
          >
            <option value="all">전체 지점</option>
            {branches.map(b => (
              <option key={b.code} value={b.code}>{b.code}_{b.name}</option>
            ))}
          </select>
          <select
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            className="px-2 py-1 border border-gray-200 rounded bg-white"
          >
            <option value="all">전체 사용자</option>
            {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select
            value={filterKind}
            onChange={e => setFilterKind(e.target.value)}
            className="px-2 py-1 border border-gray-200 rounded bg-white"
          >
            <option value="all">전체 종류</option>
            <option value="schedule">스케줄</option>
            <option value="employee">직원</option>
            <option value="memo">메모</option>
            <option value="training">직군</option>
          </select>
          <select
            value={limit}
            onChange={e => setLimit(parseInt(e.target.value))}
            className="px-2 py-1 border border-gray-200 rounded bg-white"
          >
            <option value="50">최근 50개</option>
            <option value="200">최근 200개</option>
            <option value="500">최근 500개</option>
            <option value="1000">최근 1000개</option>
          </select>
          <button onClick={loadLogs} className="px-2 py-1 bg-slate-600 text-white rounded hover:bg-slate-700">🔄 새로고침</button>
          <span className="ml-auto text-gray-500">{filteredLogs.length}개 표시 / 전체 {logs.length}개</span>
        </div>

        {/* 표 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center text-gray-400 py-12 text-sm">로딩 중...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center text-gray-400 py-12 text-sm">기록이 없거나 필터 조건에 맞는 기록이 없습니다</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-gray-100 text-gray-600 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left w-32">시간</th>
                  <th className="px-3 py-2 text-left w-24">사용자</th>
                  <th className="px-3 py-2 text-left w-20">종류</th>
                  <th className="px-3 py-2 text-left w-16">액션</th>
                  <th className="px-3 py-2 text-left w-40">지점</th>
                  <th className="px-3 py-2 text-left w-16">월</th>
                  <th className="px-3 py-2 text-left">내용</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, i) => (
                  <tr key={log.id || i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-1.5 text-gray-500" title={formatExact(log.ts)}>
                      {formatTimeAgo(log.ts)}
                    </td>
                    <td className="px-3 py-1.5 font-medium text-gray-800">{log.user_name || '-'}</td>
                    <td className="px-3 py-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${KIND_BADGE[log.kind] || 'bg-gray-100 text-gray-600'}`}>
                        {KIND_LABEL[log.kind] || log.kind}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${ACTION_BADGE(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-gray-600">
                      {log.branch_code ? (
                        <>
                          <span className="text-gray-400 text-[10px] mr-1">{log.branch_code}</span>
                          {log.branch_name || ''}
                        </>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-1.5 text-gray-500">{log.month ? `${log.month}월` : '-'}</td>
                    <td className="px-3 py-1.5 text-gray-700">{log.label || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-5 py-2 border-t bg-gray-50 text-[11px] text-gray-500">
          ※ 모든 변경사항이 영구 기록됩니다. 누가 무엇을 덮어썼는지 추적할 수 있어요.
          데이터가 원복된 것 같으면 여기서 시간순으로 누가 마지막 저장했는지 확인하세요.
        </div>
      </div>
    </div>
  );
}
