-- ============================================================
-- 007: Add CLEANING Room Status & status_updated_at Column
-- Resolves Issue #10: CẬP NHẬT TRẠNG THÁI PHÒNG & LUỒNG LỄ TÂN
-- ============================================================

-- 1. Add 'CLEANING' value to room_status enum if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumtypid = 'room_status'::regtype
      AND enumlabel = 'CLEANING'
  ) THEN
    ALTER TYPE room_status ADD VALUE 'CLEANING';
  END IF;
END$$;

-- 2. Add status_updated_at column to rooms table if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rooms'
      AND column_name = 'status_updated_at'
  ) THEN
    ALTER TABLE rooms ADD COLUMN status_updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
  END IF;
END$$;

-- 3. Ensure index exists for status_updated_at for fast timer queries and dashboard stats
CREATE INDEX IF NOT EXISTS idx_rooms_status_updated_at ON rooms(status_updated_at);
