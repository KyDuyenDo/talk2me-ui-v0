-- ================================================
-- Talk2Me LearnTube — System key usage (daily quota tracking)
-- Migration: 004_add_system_key_usage.sql
-- Tracks calls made using the shared SYSTEM_OPENROUTER_API_KEY (talk2me-api/.env),
-- so a per-user daily quota can be enforced. BYOK calls (user's own key) are never
-- recorded here — see app/services/quota.py::is_system_key.
-- ================================================

create table if not exists system_key_usage (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  action     text not null,  -- 'generate_course' | 'evaluate_writing' | 'evaluate_speaking'
  created_at timestamptz not null default now()
);

create index if not exists idx_system_key_usage_lookup on system_key_usage (user_id, action, created_at);

alter table system_key_usage enable row level security;

create policy "system_key_usage_own_select" on system_key_usage for select
  using (user_id = auth.uid());
