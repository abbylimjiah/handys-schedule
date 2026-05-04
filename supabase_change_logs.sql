-- 변경 이력 (감사 로그) 테이블
-- 누가 / 언제 / 어느 지점 / 뭘 변경했는지 영구 기록

CREATE TABLE IF NOT EXISTS change_logs (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ DEFAULT NOW(),
  user_name TEXT,
  user_email TEXT,
  kind TEXT NOT NULL,           -- 'schedule' | 'employee' | 'memo' | 'training'
  branch_code TEXT,
  branch_name TEXT,
  year INTEGER,
  month INTEGER,
  action TEXT NOT NULL,         -- '저장' | '추가' | '삭제' | '수정' 등
  label TEXT,                   -- 사용자에게 표시할 라벨 (예: "셀 편집 (Marin 5일)")
  detail JSONB                  -- 상세 정보 (변경된 셀 목록 등)
);

-- 인덱스 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_change_logs_ts ON change_logs (ts DESC);
CREATE INDEX IF NOT EXISTS idx_change_logs_branch ON change_logs (branch_code, year, month);
CREATE INDEX IF NOT EXISTS idx_change_logs_user ON change_logs (user_name);
CREATE INDEX IF NOT EXISTS idx_change_logs_kind ON change_logs (kind);

-- RLS는 비활성화 (모두 INSERT/SELECT 가능)
ALTER TABLE change_logs DISABLE ROW LEVEL SECURITY;

-- 90일 이상 된 로그 자동 삭제 (선택사항 - 원하면 주석 해제)
-- CREATE OR REPLACE FUNCTION cleanup_old_logs() RETURNS void AS $$
-- BEGIN
--   DELETE FROM change_logs WHERE ts < NOW() - INTERVAL '90 days';
-- END;
-- $$ LANGUAGE plpgsql;

-- 확인 쿼리
SELECT 'Table created successfully' AS status,
       (SELECT COUNT(*) FROM change_logs) AS row_count;
