-- Supabase SQL Editor で実行してください

-- スタッフテーブル
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  shifts JSONB NOT NULL DEFAULT '{"0":[],"1":[],"2":[],"3":[]}',
  sort_order INT NOT NULL DEFAULT 0
);

-- 打刻記録テーブル
CREATE TABLE IF NOT EXISTS records (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('start', 'end')),
  ts TIMESTAMPTZ NOT NULL,
  time_str TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS ポリシー（anon キーでの全操作を許可）
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_staff" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_records" ON records FOR ALL USING (true) WITH CHECK (true);
