// 지점 TO(정원 목표) 조정값 저장/불러오기 (Supabase + localStorage 폴백)
// 기본 TO는 mockData.ts branches 상수에 있고, 여기 저장된 값이 있으면 그걸로 덮어씀.

import { supabase, isSupabaseEnabled } from './supabase';

const LOCAL_KEY = 'handys-branch-to';

export type BranchToMap = Record<string, number>; // branchCode → TO

let memCache: BranchToMap | null = null;

function loadLocal(): BranchToMap {
  if (memCache) return memCache;
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    memCache = stored ? JSON.parse(stored) : {};
  } catch {
    memCache = {};
  }
  return memCache!;
}

function saveLocal(map: BranchToMap): void {
  memCache = map;
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(map)); } catch {}
}

// 동기 조회 (이미 로드된 캐시 기준) — 렌더링에서 사용
export function getBranchToOverrides(): BranchToMap {
  return loadLocal();
}

// Supabase에서 전체 TO 조정값 불러오기 (앱 시작 시 1회)
export async function fetchBranchTo(): Promise<BranchToMap> {
  if (isSupabaseEnabled() && supabase) {
    try {
      const { data, error } = await supabase
        .from('branch_to')
        .select('code, to_count');
      if (!error && data) {
        const map: BranchToMap = {};
        data.forEach((r: { code: string; to_count: number }) => {
          if (r.code != null && r.to_count != null) map[r.code] = r.to_count;
        });
        saveLocal(map);
        return map;
      }
    } catch (e) {
      console.warn('branch_to load failed', e);
    }
  }
  return loadLocal();
}

// 한 지점 TO 저장 (localStorage 즉시 + Supabase upsert)
export async function saveBranchTo(code: string, toCount: number): Promise<boolean> {
  const map = { ...loadLocal(), [code]: toCount };
  saveLocal(map);

  if (!isSupabaseEnabled() || !supabase) return true;
  try {
    const { error } = await supabase
      .from('branch_to')
      .upsert({ code, to_count: toCount, updated_at: new Date().toISOString() }, { onConflict: 'code' });
    if (error) { console.error('branch_to save failed', error); return false; }
    return true;
  } catch (e) {
    console.error('branch_to save error', e);
    return false;
  }
}

// 실시간 구독 (다른 사람이 TO 바꾸면 자동 반영)
export function subscribeToBranchTo(onUpdate: (map: BranchToMap) => void): () => void {
  if (!isSupabaseEnabled() || !supabase) return () => {};
  const channel = supabase
    .channel('branch-to-all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'branch_to' }, async () => {
      const map = await fetchBranchTo();
      onUpdate(map);
    })
    .subscribe();
  return () => { if (supabase) supabase.removeChannel(channel); };
}
