-- Migration to add status column to hotel_rooms table
ALTER TABLE public.hotel_rooms 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'AVAILABLE' NOT NULL;
