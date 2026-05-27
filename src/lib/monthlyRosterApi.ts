// 월별 직원 명단 (Monthly Roster)
// 한 지점에서 특정 (year, month)에 표시될 직원 ID 화이트리스트.
// 새 월 진입 시 가장 가까운 이전 달 명단을 자동 복사(시드).
// localStorage 우선, Supabase 동기화는 monthly_rosters 테이블 (정상화 SQL 별도 제공).

import { Employee } from '@/data/mockData';
import { supabase, isSupabaseEnabled } from './supabase';

const LOCAL_KEY = 'handys-monthly-roster';

// 메모리 캐시 (Supabase에서 한 번 가져온 데이터)
let memCache: MonthlyRosterMap | null = null;

type EmpKey = string; // `${code}-${num}` 형식
type MonthlyRosterMap = Record<string, EmpKey[]>; // `${branchCode}-${year}-${month}` → EmpKey[]

function rosterKey(branchCode: string, year: number, month: number): string {
  return `${branchCode}-${year}-${month}`;
}

function loadAll(): MonthlyRosterMap {
  if (memCache) return memCache;
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    memCache = stored ? JSON.parse(stored) : {};
    return memCache!;
  } catch {
    memCache = {};
    return memCache;
  }
}

function saveAll(data: MonthlyRosterMap): void {
  memCache = data;
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch {}
}

export function empKeyOf(e: Pick<Employee, 'code' | 'num'>): EmpKey {
  return `${e.code}-${e.num}`;
}

// 해당 월의 명단 (없으면 null)
export function getMonthlyRoster(branchCode: string, year: number, month: number): EmpKey[] | null {
  const data = loadAll();
  return data[rosterKey(branchCode, year, month)] || null;
}

// 가장 가까운 과거 명단 찾기 (24개월 거슬러)
export function findPreviousRoster(branchCode: string, year: number, month: number): EmpKey[] | null {
  const data = loadAll();
  for (let i = 1; i <= 24; i++) {
    let m = month - i;
    let y = year;
    while (m < 1) { m += 12; y -= 1; }
    const found = data[rosterKey(branchCode, y, m)];
    if (found) return found;
  }
  return null;
}

// 명단이 없으면 자동 시드 (이전 달 복사 / 없으면 마스터 명단)
export function ensureMonthlyRoster(
  branchCode: string,
  year: number,
  month: number,
  allEmployees: Employee[]
): EmpKey[] {
  const existing = getMonthlyRoster(branchCode, year, month);
  if (existing) return existing;

  const prev = findPreviousRoster(branchCode, year, month);
  if (prev) {
    setMonthlyRoster(branchCode, year, month, prev);
    return prev;
  }

  // 첫 사용: 현 지점 마스터 명단 시드
  const seed = allEmployees.filter(e => e.code === branchCode).map(empKeyOf);
  setMonthlyRoster(branchCode, year, month, seed);
  return seed;
}

export function setMonthlyRoster(
  branchCode: string,
  year: number,
  month: number,
  members: EmpKey[]
): void {
  const data = loadAll();
  data[rosterKey(branchCode, year, month)] = members;
  saveAll(data);
  // Supabase 비동기 동기화 (실패해도 무시)
  syncRosterToSupabase(branchCode, year, month, members).catch(() => {});
}

export function addToMonthlyRoster(
  branchCode: string,
  year: number,
  month: number,
  empKey: EmpKey
): void {
  const data = loadAll();
  const key = rosterKey(branchCode, year, month);
  const list = data[key] || [];
  if (!list.includes(empKey)) {
    data[key] = [...list, empKey];
    saveAll(data);
    syncRosterToSupabase(branchCode, year, month, data[key]).catch(() => {});
  }
}

export function removeFromMonthlyRoster(
  branchCode: string,
  year: number,
  month: number,
  empKey: EmpKey
): void {
  const data = loadAll();
  const key = rosterKey(branchCode, year, month);
  if (!data[key]) return;
  data[key] = data[key].filter(k => k !== empKey);
  saveAll(data);
  syncRosterToSupabase(branchCode, year, month, data[key]).catch(() => {});
}

// 명단에 포함되어 있는지 (없는 키는 마스터 명단의 기본 포함으로 간주하지 않음 — 명시적 시드 필요)
export function isInMonthlyRoster(
  branchCode: string,
  year: number,
  month: number,
  empKey: EmpKey
): boolean {
  const r = getMonthlyRoster(branchCode, year, month);
  if (!r) return true; // 명단 미설정 시 폴백: 모두 표시 (안전한 기본값)
  return r.includes(empKey);
}

// === Supabase 동기화 ===
async function syncRosterToSupabase(
  branchCode: string,
  year: number,
  month: number,
  members: EmpKey[]
): Promise<void> {
  if (!isSupabaseEnabled() || !supabase) return;
  try {
    await supabase.from('monthly_rosters').upsert({
      branch_code: branchCode,
      year,
      month,
      members, // jsonb (string[])
      updated_at: new Date().toISOString(),
    }, { onConflict: 'branch_code,year,month' });
  } catch {
    // Supabase 테이블이 아직 없을 수 있음 — 무시
  }
}

// Supabase에서 전체 명단 불러와 캐시 (앱 시작 시 1회)
export async function fetchAllRostersFromSupabase(): Promise<void> {
  if (!isSupabaseEnabled() || !supabase) return;
  try {
    const { data, error } = await supabase
      .from('monthly_rosters')
      .select('branch_code, year, month, members');
    if (error || !data) return;
    const map: MonthlyRosterMap = {};
    data.forEach((r: { branch_code: string; year: number; month: number; members: EmpKey[] }) => {
      map[rosterKey(r.branch_code, r.year, r.month)] = r.members || [];
    });
    // 기존 localStorage 데이터와 병합 (Supabase 우선)
    const local = loadAll();
    memCache = { ...local, ...map };
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(memCache)); } catch {}
  } catch {
    // 테이블이 없거나 RLS 차단 — 무시
  }
}

// 실시간 구독
export function subscribeToMonthlyRosters(onUpdate: () => void): () => void {
  if (!isSupabaseEnabled() || !supabase) return () => {};
  const channel = supabase
    .channel('monthly-rosters-all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_rosters' }, async (payload) => {
      const row = (payload as { new?: { branch_code?: string; year?: number; month?: number; members?: EmpKey[] } }).new;
      if (row && row.branch_code && row.year != null && row.month != null) {
        const data = loadAll();
        data[rosterKey(row.branch_code, row.year, row.month)] = row.members || [];
        saveAll(data);
        onUpdate();
      }
    })
    .subscribe();
  return () => { if (supabase) supabase.removeChannel(channel); };
}
