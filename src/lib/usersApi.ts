// 사용자 관리(ManagedUser) Supabase 동기화

import { supabase, isSupabaseEnabled } from './supabase';
import { ManagedUser } from '@/data/auth';

const LOCAL_KEY = 'handys-managed-users';

export async function fetchManagedUsers(): Promise<ManagedUser[]> {
  if (isSupabaseEnabled() && supabase) {
    try {
      // 임시권 컬럼이 없는 환경도 지원: 우선 *로 가져오고 없는 컬럼은 undefined로 매핑
      const { data, error } = await supabase
        .from('managed_users')
        .select('*')
        .order('korean_name');
      if (!error && data) {
        const users: ManagedUser[] = data.map((r: any) => ({
          englishName: r.english_name,
          koreanName: r.korean_name || '',
          email: r.email || '',
          role: r.role as ManagedUser['role'],
          branches: Array.isArray(r.branches) ? r.branches : [],
          homeBranch: r.home_branch || '',
          homeBranchName: r.home_branch_name || '',
          status: (r.status || 'active') as ManagedUser['status'],
          tempGrantActive: r.temp_grant_active ?? undefined,
          tempGrantStart: r.temp_grant_start ?? undefined,
          tempGrantEnd: r.temp_grant_end ?? undefined,
          tempGrantAt: r.temp_grant_at ?? undefined,
          tempGrantBy: r.temp_grant_by ?? undefined,
          tempGrantHistory: Array.isArray(r.temp_grant_history) ? r.temp_grant_history : undefined,
        }));
        try { localStorage.setItem(LOCAL_KEY, JSON.stringify(users)); } catch {}
        return users;
      }
    } catch (e) {
      console.warn('Managed users load failed', e);
    }
  }
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export async function bulkSaveManagedUsers(users: ManagedUser[]): Promise<boolean> {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(users)); } catch {}

  if (!isSupabaseEnabled() || !supabase) return true;

  const buildRow = (u: ManagedUser, withTempGrant: boolean): Record<string, any> => {
    const base: Record<string, any> = {
      english_name: u.englishName,
      korean_name: u.koreanName,
      email: u.email,
      role: u.role,
      branches: u.branches,
      home_branch: u.homeBranch,
      home_branch_name: u.homeBranchName,
      status: u.status,
      updated_at: new Date().toISOString(),
    };
    if (withTempGrant) {
      base.temp_grant_active = u.tempGrantActive ?? null;
      base.temp_grant_start = u.tempGrantStart ?? null;
      base.temp_grant_end = u.tempGrantEnd ?? null;
      base.temp_grant_at = u.tempGrantAt ?? null;
      base.temp_grant_by = u.tempGrantBy ?? null;
      base.temp_grant_history = u.tempGrantHistory ?? [];
    }
    return base;
  };

  // 임시권 컬럼이 있는지 매 호출마다 시도하면 비싸므로 1회 감지 후 캐시
  const hasTempCols = (globalThis as any).__handysHasTempGrantCols;

  try {
    // 1차: 임시권 컬럼 포함해서 upsert (단, 이미 없는 것으로 확인된 경우 스킵)
    if (hasTempCols !== false) {
      const rows = users.map(u => buildRow(u, true));
      const { error } = await supabase
        .from('managed_users')
        .upsert(rows, { onConflict: 'english_name' });
      if (!error) {
        (globalThis as any).__handysHasTempGrantCols = true;
        return true;
      }

      // 임시권 컬럼 부재로 추정 → fallback
      const msg = ((error as any)?.message || '') + ' ' + ((error as any)?.details || '') + ' ' + ((error as any)?.hint || '');
      const looksLikeMissingColumn = (error as any)?.code === '42703' ||
        /temp_grant/i.test(msg) || /column.*does not exist/i.test(msg);
      if (looksLikeMissingColumn) {
        (globalThis as any).__handysHasTempGrantCols = false;
        console.warn('[usersApi] temp_grant_* 컬럼이 없습니다. 임시권은 localStorage만 사용됩니다. supabase_temp_grants.sql을 Supabase에서 실행해주세요.');
      } else {
        // 다른 종류 에러도 일단 fallback 시도 (다른 데이터라도 저장)
        console.warn('[usersApi] 임시권 컬럼 포함 저장 실패, fallback 시도:', error);
      }
    }

    // 2차: 임시권 컬럼 빼고 재시도
    const fallbackRows = users.map(u => buildRow(u, false));
    const { error: e2 } = await supabase
      .from('managed_users')
      .upsert(fallbackRows, { onConflict: 'english_name' });
    if (e2) { console.error('Users save failed (fallback)', JSON.stringify(e2)); return false; }
    return true;
  } catch (e) {
    console.error('Users save threw', e);
    return false;
  }
}

export function subscribeToManagedUsers(onUpdate: (users: ManagedUser[]) => void): () => void {
  if (!isSupabaseEnabled() || !supabase) return () => {};

  const channel = supabase
    .channel('managed-users-all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'managed_users' }, async () => {
      const users = await fetchManagedUsers();
      onUpdate(users);
    })
    .subscribe();

  return () => {
    if (supabase) supabase.removeChannel(channel);
  };
}
