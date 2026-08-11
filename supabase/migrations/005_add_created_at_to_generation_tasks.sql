-- ================================================
-- Talk2Me LearnTube — Fix missing generation_tasks.created_at
-- Migration: 005_add_created_at_to_generation_tasks.sql
-- The claim_next_task() RPC (migration 001) does `ORDER BY created_at` when claiming the
-- next pending task, but generation_tasks never had a created_at column — only
-- updated_at. This bug was dormant because nothing called the RPC until the
-- checkpoint/resume orchestrator (app/agents/orchestrator.py) started using it.
-- ================================================

alter table generation_tasks
  add column if not exists created_at timestamptz not null default now();
