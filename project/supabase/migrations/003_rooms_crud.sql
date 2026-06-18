-- ============================================================
-- SQL Migration for Rooms Management & Supabase Storage
-- Run this in Supabase SQL Editor or apply as migration
-- ============================================================

-- 1. CREATE HOTEL_ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.hotel_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  price_per_night NUMERIC(12, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  beds INTEGER DEFAULT 1 NOT NULL,
  guests INTEGER DEFAULT 2 NOT NULL,
  rating NUMERIC(2, 1) DEFAULT 5.0 NOT NULL,
  available_rooms INTEGER DEFAULT 5 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on public.hotel_rooms
ALTER TABLE public.hotel_rooms ENABLE ROW LEVEL SECURITY;

-- 2. CREATE RLS POLICIES FOR HOTEL_ROOMS TABLE
DROP POLICY IF EXISTS "Allow public read on hotel_rooms" ON public.hotel_rooms;
CREATE POLICY "Allow public read on hotel_rooms" 
  ON public.hotel_rooms FOR SELECT USING (true);

-- Cho phép toàn quyền CRUD cho mục đích phát triển giống cấu hình bảng hotels cũ
DROP POLICY IF EXISTS "Allow admin full control on hotel_rooms" ON public.hotel_rooms;
CREATE POLICY "Allow admin full control on hotel_rooms" 
  ON public.hotel_rooms FOR ALL USING (true) WITH CHECK (true);

-- 3. CREATE STORAGE BUCKET FOR ROOM IMAGES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects if not already enabled (managed by Supabase system)

-- 4. RLS POLICIES FOR ROOM IMAGES BUCKET
DROP POLICY IF EXISTS "Allow public read on room-images" ON storage.objects;
CREATE POLICY "Allow public read on room-images" 
  ON storage.objects FOR SELECT USING (bucket_id = 'room-images');

DROP POLICY IF EXISTS "Allow admin insert on room-images" ON storage.objects;
CREATE POLICY "Allow admin insert on room-images" 
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'room-images');

DROP POLICY IF EXISTS "Allow admin update on room-images" ON storage.objects;
CREATE POLICY "Allow admin update on room-images" 
  ON storage.objects FOR UPDATE USING (bucket_id = 'room-images');

DROP POLICY IF EXISTS "Allow admin delete on room-images" ON storage.objects;
CREATE POLICY "Allow admin delete on room-images" 
  ON storage.objects FOR DELETE USING (bucket_id = 'room-images');

-- 5. SEED DEFAULT ROOM DATA MATCHING FRONTEND CARDS (ALL 8 ENTITIES)
TRUNCATE TABLE public.hotel_rooms CASCADE;

INSERT INTO public.hotel_rooms (title, location, price_per_night, image_url, beds, guests, rating, available_rooms) VALUES
  (
    'Best Western Cedars Hotel', 
    '1 Anzinger Court', 
    26.00, 
    'https://images.pexels.com/photos/5191371/pexels-photo-5191371.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500', 
    10, 
    6, 
    4.8, 
    5
  ),
  (
    'Bell by Greene King Inns', 
    '32923 Judy Hill', 
    250.00, 
    'https://images.pexels.com/photos/3201735/pexels-photo-3201735.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500', 
    6, 
    4, 
    4.4, 
    3
  ),
  (
    'Half Moon, Sherborne by Marston''s Inns', 
    '6731 Killdeer Park', 
    278.00, 
    'https://images.pexels.com/photos/6434634/pexels-photo-6434634.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500', 
    9, 
    5, 
    3.6, 
    2
  ),
  (
    'White Horse Hotel by Greene King Inns', 
    '35 Sherman Park', 
    40.00, 
    'https://images.pexels.com/photos/2506988/pexels-photo-2506988.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500', 
    7, 
    4, 
    4.8, 
    4
  ),
  (
    'Ship and Castle Hotel',
    '3 Crest Line Park',
    147.00,
    'https://images.pexels.com/photos/261327/pexels-photo-261327.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    3,
    8,
    3.4,
    5
  ),
  (
    'The Windmill Family & Commercial Hotel',
    '55974 Waxwing Junction',
    90.00,
    'https://images.pexels.com/photos/2373201/pexels-photo-2373201.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    7,
    8,
    3.8,
    6
  ),
  (
    'Unicorn, Gunthorpe by Marston''s Inns',
    '79361 Chinook Place',
    282.00,
    'https://images.pexels.com/photos/3068519/pexels-photo-3068519.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    2,
    9,
    3.0,
    3
  ),
  (
    'Holiday Inn Express Ramsgate Minster, an IHG Hotel',
    '6 Chive Avenue',
    79.00,
    'https://images.pexels.com/photos/2343466/pexels-photo-2343466.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
    7,
    6,
    3.9,
    4
  )
ON CONFLICT DO NOTHING;
