// 직군 (Training) 관리 Supabase 동기화
import { supabase, isSupabaseEnabled } from './supabase';

export interface TrainingLegacy {
  manager_name: string;
  m1: number;
  m2: number;
  m3: number;
  m4: number;
  a1: number;
  a2: number;
  note?: string;
}

export interface TrainingRecord {
  manager_name: string;
  branch_code: string;
  year: number;
  month: number;
  m1: boolean;
  m2: boolean;
  m3: boolean;
  m4: boolean;
  a1: boolean;
  a2: boolean;
  updated_by?: string;
}

// === 과거 누적 (legacy) ===

export async function fetchAllLegacy(): Promise<TrainingLegacy[]> {
  if (!isSupabaseEnabled() || !supabase) return [];
  const { data, error } = await supabase
    .from('training_legacy')
    .select('manager_name, m1, m2, m3, m4, a1, a2, note')
    .order('manager_name');
  if (error) { console.error('legacy load fail', error); return []; }
  return data || [];
}

export async function saveLegacy(row: TrainingLegacy): Promise<boolean> {
  if (!isSupabaseEnabled() || !supabase) return false;
  const { error } = await supabase
    .from('training_legacy')
    .upsert({
      manager_name: row.manager_name,
      m1: row.m1, m2: row.m2, m3: row.m3, m4: row.m4,
      a1: row.a1, a2: row.a2,
      note: row.note || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'manager_name' });
  if (error) { console.error('legacy save fail', error); return false; }
  return true;
}

export async function deleteLegacy(managerName: string): Promise<boolean> {
  if (!isSupabaseEnabled() || !supabase) return false;
  const { error } = await supabase
    .from('training_legacy')
    .delete()
    .eq('manager_name', managerName);
  if (error) { console.error('legacy delete fail', error); return false; }
  return true;
}

// === 월별 기록 (records) ===

export async function fetchRecordsByBranchMonth(branchCode: string, year: number, month: number): Promise<TrainingRecord[]> {
  if (!isSupabaseEnabled() || !supabase) return [];
  const { data, error } = await supabase
    .from('training_records')
    .select('*')
    .eq('branch_code', branchCode)
    .eq('year', year)
    .eq('month', month);
  if (error) { console.error('records load fail', error); return []; }
  return data || [];
}

export async function fetchAllRecords(): Promise<TrainingRecord[]> {
  if (!isSupabaseEnabled() || !supabase) return [];
  const { data, error } = await supabase
    .from('training_records')
    .select('*');
  if (error) { console.error('all records load fail', error); return []; }
  return data || [];
}

export async function saveRecord(row: TrainingRecord): Promise<boolean> {
  if (!isSupabaseEnabled() || !supabase) return false;
  const { error } = await supabase
    .from('training_records')
    .upsert({
      manager_name: row.manager_name,
      branch_code: row.branch_code,
      year: row.year,
      month: row.month,
      m1: row.m1, m2: row.m2, m3: row.m3, m4: row.m4,
      a1: row.a1, a2: row.a2,
      updated_by: row.updated_by || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'manager_name,year,month' });
  if (error) { console.error('record save fail', error); return false; }
  return true;
}

// 합산 뷰: legacy + 누적 records
export function sumRecords(records: TrainingRecord[]): {m1:number;m2:number;m3:number;m4:number;a1:number;a2:number} {
  const s = { m1:0,m2:0,m3:0,m4:0,a1:0,a2:0 };
  for (const r of records) {
    if (r.m1) s.m1++;
    if (r.m2) s.m2++;
    if (r.m3) s.m3++;
    if (r.m4) s.m4++;
    if (r.a1) s.a1++;
    if (r.a2) s.a2++;
  }
  return s;
}

// === 실시간 구독 ===
export function subscribeToTraining(onChange: () => void): () => void {
  if (!isSupabaseEnabled() || !supabase) return () => {};
  const ch1 = supabase
    .channel('training-legacy')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'training_legacy' }, onChange)
    .subscribe();
  const ch2 = supabase
    .channel('training-records')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'training_records' }, onChange)
    .subscribe();
  return () => {
    if (supabase) {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    }
  };
}
