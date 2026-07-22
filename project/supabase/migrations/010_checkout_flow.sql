-- Migration: 010_checkout_flow
-- Adds checkout workflow tracking to the bookings table.

-- Create checkout_step type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checkout_step') THEN
        CREATE TYPE checkout_step AS ENUM ('NONE', 'REQUESTED', 'INSPECTING', 'INSPECTED');
    END IF;
END
$$;

-- Add checkout flow columns to bookings table
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS checkout_step checkout_step DEFAULT 'NONE' NOT NULL,
  ADD COLUMN IF NOT EXISTS checkout_message TEXT,
  ADD COLUMN IF NOT EXISTS checkout_requested_at TIMESTAMPTZ;

-- Add index on checkout_step to help with queries (e.g., finding pending requests for receptionist/cleaner)
CREATE INDEX IF NOT EXISTS idx_bookings_checkout_step ON bookings(checkout_step);
