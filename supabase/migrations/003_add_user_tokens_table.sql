-- ================================================
-- Migration: 003_add_user_tokens_table.sql
-- Thêm bảng user_tokens & cột refresh_token/access_token để quản lý JWT Tokens & Active Sessions trên Supabase
-- ================================================

-- 1. Bổ sung trường refresh_token vào bảng profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS refresh_token text,
ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;

-- 2. Tạo bảng user_tokens chuyên dụng cho quản lý đa thiết bị / đa phiên đăng nhập
CREATE TABLE IF NOT EXISTS user_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_type    text NOT NULL DEFAULT 'bearer',
  access_token  text NOT NULL,
  refresh_token text,
  user_agent    text,
  ip_address    text,
  is_revoked    boolean NOT NULL DEFAULT false,
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_tokens_user ON user_tokens(user_id, is_revoked);
CREATE INDEX IF NOT EXISTS idx_user_tokens_access ON user_tokens(access_token);
