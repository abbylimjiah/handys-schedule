-- 월별 직원 명단 (Monthly Rosters) Supabase 스키마
-- 매니저들끼리 명단 변경을 실시간 동기화하기 위한 테이블.
-- (현재는 localStorage 우선 동작 + 이 테이블로 동기화 시도)

CREATE TABLE IF NOT EXISTS public.monthly_rosters (
  id BIGSERIAL PRIMARY KEY,
  branch_code TEXT NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  members JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (branch_code, year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_rosters_branch_year_month
  ON public.monthly_rosters (branch_code, year, month);

-- RLS 활성화 + 모두 read/write 허용 (다른 테이블과 동일한 패턴)
-- 추후 Auth 도입 시 정책 강화
ALTER TABLE public.monthly_rosters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "monthly_rosters_select" ON public.monthly_rosters;
CREATE POLICY "monthly_rosters_select" ON public.monthly_rosters
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "monthly_rosters_insert" ON public.monthly_rosters;
CREATE POLICY "monthly_rosters_insert" ON public.monthly_rosters
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "monthly_rosters_update" ON public.monthly_rosters;
CREATE POLICY "monthly_rosters_update" ON public.monthly_rosters
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "monthly_rosters_delete" ON public.monthly_rosters;
CREATE POLICY "monthly_rosters_delete" ON public.monthly_rosters
  FOR DELETE USING (true);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.monthly_rosters;
