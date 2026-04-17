// 직원 정보 Supabase 동기화

import { supabase, isSupabaseEnabled } from './supabase';
import { Employee, defaultEmployees } from '@/data/mockData';

const LOCAL_KEY = 'handys-schedule-employees';

// 직원 목록 불러오기 (Supabase 우선)
export async function fetchEmployees(): Promise<Employee[]> {
  if (isSupabaseEnabled() && supabase) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('code, branch, num, name, role, hire_date')
        .order('code')
        .order('num');
      if (!error && data && data.length > 0) {
        const emps: Employee[] = data.map(r => ({
          code: r.code,
          branch: r.branch,
          num: r.num,
          name: r.name,
          role: r.role as Employee['role'],
          hireDate: r.hire_date || '',
        }));
        try { localStorage.setItem(LOCAL_KEY, JSON.stringify(emps)); } catch {}
        return emps;
      }
      // 서버에 없으면 기본 데이터 업로드
      if (!error && data && data.length === 0) {
        await bulkUploadEmployees(defaultEmployees);
        return defaultEmployees;
      }
    } catch (e) {
      console.warn('Supabase employees load failed', e);
    }
  }
  // localStorage 폴백
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultEmployees;
}

// 전체 덮어쓰기
export async function bulkUploadEmployees(employees: Employee[]): Promise<boolean> {
  if (!isSupabaseEnabled() || !supabase) return false;
  try {
    await supabase.from('employees').delete().gte('id', 0);
    const rows = employees.map(e => ({
      code: e.code,
      branch: e.branch,
      num: e.num,
      name: e.name,
      role: e.role,
      hire_date: e.hireDate || null,
    }));
    const { error } = await supabase.from('employees').insert(rows);
    if (error) { console.error('Bulk upload failed', error); return false; }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

// 한 지점 전체 저장 (덮어쓰기)
export async function saveBranchEmployees(branchCode: string, employees: Employee[]): Promise<boolean> {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(employees)); } catch {}

  if (!isSupabaseEnabled() || !supabase) return true;
  try {
    await supabase.from('employees').delete().eq('code', branchCode);
    const rows = employees
      .filter(e => e.code === branchCode)
      .map(e => ({
        code: e.code,
        branch: e.branch,
        num: e.num,
        name: e.name,
        role: e.role,
        hire_date: e.hireDate || null,
      }));
    if (rows.length > 0) {
      const { error } = await supabase.from('employees').insert(rows);
      if (error) { console.error('Branch save failed', error); return false; }
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

// 실시간 구독
export function subscribeToEmployees(onUpdate: (employees: Employee[]) => void): () => void {
  if (!isSupabaseEnabled() || !supabase) return () => {};

  const channel = supabase
    .channel('employees-all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, async () => {
      const emps = await fetchEmployees();
      onUpdate(emps);
    })
    .subscribe();

  return () => {
    if (supabase) supabase.removeChannel(channel);
  };
}
