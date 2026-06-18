-- ============================================================
-- SQL Migration for Experiences Management & Supabase Storage
-- ============================================================

-- 1. CREATE EXPERIENCES TABLE
CREATE TABLE IF NOT EXISTS public.experiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  guests INTEGER DEFAULT 2 NOT NULL,
  rating NUMERIC(2, 1) DEFAULT 5.0 NOT NULL,
  review_count INTEGER DEFAULT 0 NOT NULL,
  city TEXT DEFAULT 'New York' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- 2. CREATE RLS POLICIES FOR EXPERIENCES TABLE
DROP POLICY IF EXISTS "Allow public read on experiences" ON public.experiences;
CREATE POLICY "Allow public read on experiences" 
  ON public.experiences FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin full control on experiences" ON public.experiences;
CREATE POLICY "Allow admin full control on experiences" 
  ON public.experiences FOR ALL USING (true) WITH CHECK (true);

-- 3. CREATE STORAGE BUCKET FOR EXPERIENCE IMAGES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('experience-images', 'experience-images', true)
ON CONFLICT (id) DO NOTHING;

-- 4. RLS POLICIES FOR EXPERIENCE IMAGES BUCKET
DROP POLICY IF EXISTS "Allow public read on experience-images" ON storage.objects;
CREATE POLICY "Allow public read on experience-images" 
  ON storage.objects FOR SELECT USING (bucket_id = 'experience-images');

DROP POLICY IF EXISTS "Allow admin insert on experience-images" ON storage.objects;
CREATE POLICY "Allow admin insert on experience-images" 
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'experience-images');

DROP POLICY IF EXISTS "Allow admin update on experience-images" ON storage.objects;
CREATE POLICY "Allow admin update on experience-images" 
  ON storage.objects FOR UPDATE USING (bucket_id = 'experience-images');

DROP POLICY IF EXISTS "Allow admin delete on experience-images" ON storage.objects;
CREATE POLICY "Allow admin delete on experience-images" 
  ON storage.objects FOR DELETE USING (bucket_id = 'experience-images');

-- 5. SEED DEFAULT EXPERIENCES DATA
TRUNCATE TABLE public.experiences CASCADE;

INSERT INTO public.experiences (title, location, price, image_url, guests, rating, review_count, city) VALUES
  (
    'Generate Interactive Markets',
    '2 Warner Alley',
    200.00,
    'https://images.pexels.com/photos/386009/pexels-photo-386009.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
    10,
    4.4,
    478,
    'New York'
  ),
  (
    'deliver dynamic e-services',
    '620 Clove Park',
    249.00,
    'https://images.pexels.com/photos/6455686/pexels-photo-6455686.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
    6,
    3.2,
    566,
    'New York'
  ),
  (
    'productize holistic deliverables',
    '5 Butterfield Avenue',
    88.00,
    'https://images.pexels.com/photos/5560867/pexels-photo-5560867.jpeg?auto=compress&cs=tinysrgb&dpr=3&h=750&w=1260',
    6,
    3.5,
    147,
    'Tokyo'
  ),
  (
    'deploy integrated solutions',
    '11204 Lawn Court',
    47.00,
    'https://a0.muscache.com/im/pictures/lombard/MtTemplate-1435866-media_library/original/38d6b5ea-abcc-4876-acb4-e5b79586c37c.jpeg?im_w=1200',
    9,
    3.0,
    257,
    'Tokyo'
  ),
  (
    'evolve virtual models',
    '39 Del Sol Lane',
    187.00,
    'https://images.pexels.com/photos/1094794/pexels-photo-1094794.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260',
    10,
    4.4,
    132,
    'Paris'
  ),
  (
    'seize killer e-commerce',
    '45539 Kensington Drive',
    179.00,
    'https://a0.muscache.com/im/pictures/lombard/MtTemplate-1435866-media_library/original/38d6b5ea-abcc-4876-acb4-e5b79586c37c.jpeg?im_w=1200',
    9,
    4.6,
    275,
    'Paris'
  ),
  (
    'generate proactive ROI',
    '9 Jenifer Way',
    275.00,
    'https://a0.muscache.com/im/pictures/lombard/MtTemplate-1435866-media_library/original/38d6b5ea-abcc-4876-acb4-e5b79586c37c.jpeg?im_w=1200',
    10,
    3.4,
    20,
    'London'
  ),
  (
    'aggregate out-of-the-box channels',
    '5 Aberg Place',
    270.00,
    'https://a0.muscache.com/im/pictures/lombard/MtTemplate-1435866-media_library/original/38d6b5ea-abcc-4876-acb4-e5b79586c37c.jpeg?im_w=1200',
    9,
    4.9,
    268,
    'London'
  );
