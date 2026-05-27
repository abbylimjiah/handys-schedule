-- 임시 편집권한 컬럼 추가
-- 정규 편집기간(매월 20~24일) 외에도 본인 소속 지점에 한해 임시 편집을 허용하기 위한 필드.
-- 1인 1활성 권한만 가지며, 해제/대체된 과거 부여는 temp_grant_history(jsonb)에 기록.
-- Supabase SQL Editor에서 1회 실행.

ALTER TABLE managed_users
  ADD COLUMN IF NOT EXISTS temp_grant_active   BOOLEAN     DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS temp_grant_start    DATE,
  ADD COLUMN IF NOT EXISTS temp_grant_end      DATE,
  ADD COLUMN IF NOT EXISTS temp_grant_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS temp_grant_by       TEXT,
  ADD COLUMN IF NOT EXISTS temp_grant_history  JSONB       DEFAULT '[]'::jsonb;

COMMENT ON COLUMN managed_users.temp_grant_active  IS '임시 편집권 ON/OFF (마스터가 토글)';
COMMENT ON COLUMN managed_users.temp_grant_start   IS '임시 편집 시작일 (포함)';
COMMENT ON COLUMN managed_users.temp_grant_end     IS '임시 편집 종료일 (포함)';
COMMENT ON COLUMN managed_users.temp_grant_at      IS '부여 시각';
COMMENT ON COLUMN managed_users.temp_grant_by      IS '부여한 마스터 이름';
COMMENT ON COLUMN managed_users.temp_grant_history IS '해제/대체된 과거 부여 기록 배열';
