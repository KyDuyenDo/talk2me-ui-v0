-- ================================================
-- Migration: 002_add_auth_fields_to_profiles.sql
-- Thêm các trường email, password_hash, name, target_goal vào bảng profiles
-- ================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email text UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash text,
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS target_goal text DEFAULT 'IELTS 6.5+',
ADD COLUMN IF NOT EXISTS current_level text DEFAULT 'Intermediate (B1-B2)',
ADD COLUMN IF NOT EXISTS total_study_minutes int DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_lessons_count int DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'Free Member';

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
