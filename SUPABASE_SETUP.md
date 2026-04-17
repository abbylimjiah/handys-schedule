# Supabase 설정 가이드

## 1️⃣ Supabase 계정 + 프로젝트 생성

1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub로 로그인 (abbylimjiah 계정)
4. "New Project" 클릭
5. 정보 입력:
   - **Name**: `handys-schedule`
   - **Database Password**: 강력한 비번 (메모 필수!)
   - **Region**: `Northeast Asia (Seoul)`
   - **Pricing Plan**: Free
6. "Create new project" → 2~3분 대기

---

## 2️⃣ 데이터베이스 테이블 생성

프로젝트 생성되면 좌측 메뉴에서 **SQL Editor** → **+ New query** 클릭 후 아래 SQL 전체 복사해서 붙여넣기 → **Run** 클릭

```sql
-- ========================================
-- 핸디즈 BQ 스케줄 시스템 DB 스키마
-- ========================================

-- 1. 스케줄 데이터 (핵심)
CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  branch_code TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(branch_code, year, month)
);
CREATE INDEX IF NOT EXISTS idx_schedules_branch_month ON schedules(branch_code, year, month);

-- 2. 직원 정보
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  branch TEXT NOT NULL,
  num INTEGER NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  hire_date TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code, num)
);
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(code);

-- 3. 사용자 관리
CREATE TABLE IF NOT EXISTS managed_users (
  id SERIAL PRIMARY KEY,
  english_name TEXT NOT NULL UNIQUE,
  korean_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'viewer',
  branches JSONB DEFAULT '[]',
  home_branch TEXT DEFAULT '',
  home_branch_name TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 일별 메모 (지점 공통)
CREATE TABLE IF NOT EXISTS day_memos (
  id SERIAL PRIMARY KEY,
  branch_code TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  memo TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(branch_code, year, month, day)
);

-- 5. 앱 설정 (편집기간, 마스터 비번 등)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- RLS (Row Level Security) 활성화
-- ========================================
-- 프로토타입이므로 일단 누구나 읽기/쓰기 가능
-- 나중에 Supabase Auth 연동 시 강화 예정

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE managed_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON managed_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON day_memos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON app_settings FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- Realtime 활성화 (실시간 동기화용)
-- ========================================
ALTER PUBLICATION supabase_realtime ADD TABLE schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE employees;
ALTER PUBLICATION supabase_realtime ADD TABLE managed_users;
ALTER PUBLICATION supabase_realtime ADD TABLE day_memos;
```

실행 후 성공 메시지 확인!

---

## 3️⃣ API 키 복사

좌측 메뉴 **⚙️ Project Settings** → **API**

아래 두 개를 나한테 공유:
- **Project URL**: `https://xxxxxxxxxx.supabase.co`
- **anon public key** (긴 문자열 `eyJhbGc...`로 시작)

> ✅ anon key는 공개되어도 안전한 브라우저용 키입니다. RLS로 보호되고 있어요.
