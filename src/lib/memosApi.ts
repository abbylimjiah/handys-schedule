// 지점별 일일 메모 Supabase 동기화

import { supabase, isSupabaseEnabled } from './supabase';

// 메모 key 형식: "branchCode-month-dayIdx"
export type DayMemos = Record<string, string>;

const LOCAL_KEY = 'handys-day-memos';

export async function fetchAllMemos(): Promise<DayMemos> {
  if (isSupabaseEnabled() && supabase) {
    try {
      const { data, error } = await supabase
        .from('day_memos')
        .select('branch_code, month, day, memo');
      if (!error && data) {
        const memos: DayMemos = {};
        data.forEach(r => {
          const key = `${r.branch_code}-${r.month}-${r.day}`;
          memos[key] = r.memo;
        });
        try { localStorage.setItem(LOCAL_KEY, JSON.stringify(memos)); } catch {}
        return memos;
      }
    } catch (e) {
      console.warn('Memos load failed', e);
    }
  }
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

export async function saveDayMemo(
  branchCode: string,
  year: number,
  month: number,
  day: number,
  memo: string
): Promise<boolean> {
  // localStorage 먼저
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    const all: DayMemos = stored ? JSON.parse(stored) : {};
    all[`${branchCode}-${month}-${day}`] = memo;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  } catch {}

  if (!isSupabaseEnabled() || !supabase) return true;
  try {
    const { error } = await supabase
      .from('day_memos')
      .upsert({
        branch_code: branchCode,
        year,
        month,
        day,
        memo,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'branch_code,year,month,day' });
    if (error) { console.error('Memo save failed', error); return false; }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export function subscribeToMemos(onUpdate: (memos: DayMemos) => void): () => void {
  if (!isSupabaseEnabled() || !supabase) return () => {};

  const channel = supabase
    .channel('day-memos-all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'day_memos' }, async () => {
      const memos = await fetchAllMemos();
      onUpdate(memos);
    })
    .subscribe();

  return () => {
    if (supabase) supabase.removeChannel(channel);
  };
}
