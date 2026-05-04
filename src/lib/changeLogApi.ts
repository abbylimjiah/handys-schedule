// 변경 이력 (감사 로그) API
// 누가 / 언제 / 어느 지점 / 뭘 변경했는지 영구 기록

import { supabase, isSupabaseEnabled } from './supabase';
import { getCurrentUser } from '@/data/auth';

export type ChangeLogKind = 'schedule' | 'employee' | 'memo' | 'training';

export interface ChangeLog {
  id?: number;
  ts: string;
  user_name?: string;
  user_email?: string;
  kind: ChangeLogKind;
  branch_code?: string;
  branch_name?: string;
  year?: number;
  month?: number;
  action: string;
  label?: string;
  detail?: any;
}

// 변경 기록 (fire-and-forget; 실패해도 메인 작업엔 영향 없음)
export async function logChange(entry: Omit<ChangeLog, 'id' | 'ts' | 'user_name' | 'user_email'>): Promise<void> {
  if (!isSupabaseEnabled() || !supabase) return;
  try {
    const user = getCurrentUser();
    await supabase.from('change_logs').insert({
      user_name: user?.name || 'unknown',
      user_email: user?.email || null,
      kind: entry.kind,
      branch_code: entry.branch_code || null,
      branch_name: entry.branch_name || null,
      year: entry.year || null,
      month: entry.month || null,
      action: entry.action,
      label: entry.label || null,
      detail: entry.detail || null,
    });
  } catch (e) {
    console.warn('[changeLog] save failed', e);
  }
}

// 최근 N개 로그 조회
export async function fetchRecentChanges(opts: {
  limit?: number;
  branchCode?: string;
  year?: number;
  month?: number;
  userName?: string;
  kind?: ChangeLogKind;
} = {}): Promise<ChangeLog[]> {
  if (!isSupabaseEnabled() || !supabase) return [];
  try {
    let q = supabase.from('change_logs').select('*').order('ts', { ascending: false });
    if (opts.limit) q = q.limit(opts.limit);
    if (opts.branchCode) q = q.eq('branch_code', opts.branchCode);
    if (opts.year) q = q.eq('year', opts.year);
    if (opts.month) q = q.eq('month', opts.month);
    if (opts.userName) q = q.eq('user_name', opts.userName);
    if (opts.kind) q = q.eq('kind', opts.kind);
    const { data, error } = await q;
    if (error) {
      console.error('[changeLog] fetch failed', error);
      return [];
    }
    return (data || []) as ChangeLog[];
  } catch (e) {
    console.warn('[changeLog] fetch exception', e);
    return [];
  }
}

// 실시간 구독
export function subscribeToChangeLogs(onChange: () => void): () => void {
  if (!isSupabaseEnabled() || !supabase) return () => {};
  const ch = supabase
    .channel('change_logs-' + Math.random().toString(36).slice(2, 8))
    .on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'change_logs' }, onChange)
    .subscribe();
  return () => { if (supabase) supabase.removeChannel(ch); };
}
