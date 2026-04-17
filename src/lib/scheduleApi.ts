// 스케줄 데이터 저장/불러오기 (Supabase + localStorage 폴백)

import { supabase, isSupabaseEnabled } from './supabase';
import { CellData } from '@/data/mockData';

export type BranchSchedule = Record<string, CellData[]>;

const scheduleStorageKey = (branchCode: string, year: number, month: number) =>
  `handys-schedule-${branchCode}-${year}-${month}`;

// 스케줄 불러오기 (Supabase 우선, 실패 시 localStorage)
export async function loadSchedule(
  branchCode: string,
  year: number,
  month: number
): Promise<BranchSchedule | null> {
  // Supabase 시도
  if (isSupabaseEnabled() && supabase) {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('data')
        .eq('branch_code', branchCode)
        .eq('year', year)
        .eq('month', month)
        .maybeSingle();
      if (!error && data?.data) {
        // localStorage에도 백업
        try { localStorage.setItem(scheduleStorageKey(branchCode, year, month), JSON.stringify(data.data)); } catch {}
        return data.data as BranchSchedule;
      }
    } catch (e) {
      console.warn('Supabase load failed, falling back to localStorage', e);
    }
  }
  // localStorage 폴백
  try {
    const stored = localStorage.getItem(scheduleStorageKey(branchCode, year, month));
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

// 스케줄 저장 (Supabase + localStorage 동시)
export async function saveSchedule(
  branchCode: string,
  year: number,
  month: number,
  schedule: BranchSchedule,
  updatedBy?: string
): Promise<boolean> {
  // localStorage 먼저 (즉시 반영)
  try {
    localStorage.setItem(scheduleStorageKey(branchCode, year, month), JSON.stringify(schedule));
  } catch {}

  // Supabase upsert
  if (isSupabaseEnabled() && supabase) {
    try {
      const { error } = await supabase
        .from('schedules')
        .upsert({
          branch_code: branchCode,
          year,
          month,
          data: schedule,
          updated_by: updatedBy || 'unknown',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'branch_code,year,month',
        });
      if (error) {
        console.error('Supabase save failed:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase save error:', e);
      return false;
    }
  }
  return true; // Supabase 비활성화 시 localStorage만 저장
}

// 실시간 구독 (다른 사람이 수정하면 자동 반영)
export function subscribeToSchedule(
  branchCode: string,
  year: number,
  month: number,
  onUpdate: (schedule: BranchSchedule) => void
): () => void {
  if (!isSupabaseEnabled() || !supabase) {
    return () => {}; // noop
  }

  const channel = supabase
    .channel(`schedule-${branchCode}-${year}-${month}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'schedules',
        filter: `branch_code=eq.${branchCode}`,
      },
      (payload) => {
        const newRow = payload.new as { branch_code: string; year: number; month: number; data: BranchSchedule } | null;
        if (newRow && newRow.year === year && newRow.month === month) {
          onUpdate(newRow.data);
          try { localStorage.setItem(scheduleStorageKey(branchCode, year, month), JSON.stringify(newRow.data)); } catch {}
        }
      }
    )
    .subscribe();

  return () => {
    if (supabase) supabase.removeChannel(channel);
  };
}

// 모든 스케줄 일괄 로드 (로컬 백업용)
export async function loadAllSchedules(): Promise<Record<string, BranchSchedule>> {
  const result: Record<string, BranchSchedule> = {};

  if (isSupabaseEnabled() && supabase) {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('branch_code, year, month, data');
      if (!error && data) {
        data.forEach(row => {
          const cacheKey = `${row.branch_code}-${row.month}-${row.year}`;
          result[cacheKey] = row.data as BranchSchedule;
          try { localStorage.setItem(scheduleStorageKey(row.branch_code, row.year, row.month), JSON.stringify(row.data)); } catch {}
        });
        return result;
      }
    } catch (e) {
      console.warn('Supabase loadAll failed', e);
    }
  }

  // localStorage 폴백
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('handys-schedule-') && !k.includes('employees') && !k.includes('day-memos')) {
        const parts = k.replace('handys-schedule-', '').split('-');
        if (parts.length === 3) {
          const [bc, yr, mo] = parts;
          const cacheKey = `${bc}-${mo}-${yr}`;
          const val = localStorage.getItem(k);
          if (val) result[cacheKey] = JSON.parse(val);
        }
      }
    }
  } catch {}
  return result;
}
