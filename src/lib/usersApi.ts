// 사용자 관리(ManagedUser) Supabase 동기화

import { supabase, isSupabaseEnabled } from './supabase';
import { ManagedUser } from '@/data/auth';

const LOCAL_KEY = 'handys-managed-users';

export async function fetchManagedUsers(): Promise<ManagedUser[]> {
  if (isSupabaseEnabled() && supabase) {
    try {
      const { data, error } = await supabase
        .from('managed_users')
        .select('english_name, korean_name, email, role, branches, home_branch, home_branch_name, status')
        .order('korean_name');
      if (!error && data) {
        const users: ManagedUser[] = data.map(r => ({
          englishName: r.english_name,
          koreanName: r.korean_name || '',
          email: r.email || '',
          role: r.role as ManagedUser['role'],
          branches: Array.isArray(r.branches) ? r.branches : [],
          homeBranch: r.home_branch || '',
          homeBranchName: r.home_branch_name || '',
          status: (r.status || 'active') as ManagedUser['status'],
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
  try {
    const rows = users.map(u => ({
      english_name: u.englishName,
      korean_name: u.koreanName,
      email: u.email,
      role: u.role,
      branches: u.branches,
      home_branch: u.homeBranch,
      home_branch_name: u.homeBranchName,
      status: u.status,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from('managed_users')
      .upsert(rows, { onConflict: 'english_name' });
    if (error) { console.error('Users save failed', error); return false; }
    return true;
  } catch (e) {
    console.error(e);
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
