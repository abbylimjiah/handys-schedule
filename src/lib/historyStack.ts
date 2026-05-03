// 전역 히스토리 스택 (다단계 되돌리기)
// 셀 편집/직원 변경/메모 등 모든 액션을 기록하고 되돌릴 수 있게 함

import React from 'react';

export type HistoryEntryKind = 'schedule' | 'employee' | 'memo';

export interface HistoryEntry {
  id: string;
  kind: HistoryEntryKind;
  label: string;       // 사용자에게 표시할 라벨 ("5월 셀 편집" 등)
  ts: number;
  undo: () => Promise<void> | void;
}

const MAX_HISTORY = 50;
const stack: HistoryEntry[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => {
    try { fn(); } catch {}
  });
}

export function pushHistory(e: Omit<HistoryEntry, 'id' | 'ts'>) {
  stack.push({
    ...e,
    id: Math.random().toString(36).slice(2),
    ts: Date.now(),
  });
  if (stack.length > MAX_HISTORY) stack.shift();
  notify();
}

export async function undoLast(): Promise<HistoryEntry | null> {
  const e = stack.pop();
  if (!e) {
    notify();
    return null;
  }
  try {
    await e.undo();
  } catch (err) {
    console.error('[undo failed]', err);
  }
  notify();
  return e;
}

export function getHistory(): HistoryEntry[] {
  return stack.slice();
}

export function peekHistory(): HistoryEntry | undefined {
  return stack[stack.length - 1];
}

export function clearHistory() {
  stack.length = 0;
  notify();
}

// React hook: 히스토리 스택의 길이/peek 정보를 구독
export function useHistory(): { size: number; last: HistoryEntry | undefined } {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return { size: stack.length, last: stack[stack.length - 1] };
}
