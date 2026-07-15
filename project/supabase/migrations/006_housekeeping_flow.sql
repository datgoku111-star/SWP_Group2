-- ============================================================
-- SQL Migration for Housekeeping Workflow (CLEANING status & timer)
-- ============================================================

-- 1. Add 'CLEANING' value to the room_status enum
-- Note: ALTER TYPE ... ADD VALUE cannot run inside a transaction block in some Postgres versions.
-- In Supabase (Postgres 15+), this runs successfully.
ALTER TYPE room_status ADD VALUE IF NOT EXISTS 'CLEANING';

-- 2. Add status_updated_at column to the rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;

-- 3. Update existing rooms status_updated_at to match updated_at
UPDATE rooms SET status_updated_at = updated_at WHERE status_updated_at IS NULL;
