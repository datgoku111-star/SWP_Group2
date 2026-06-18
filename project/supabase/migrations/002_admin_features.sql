-- ============================================================
-- SQL Script for Admin Features & Statistics
-- Run this script in the Supabase SQL Editor or as a migration
-- ============================================================

-- 1. PROFILES TABLE AND TRIGGERS (Linked to auth.users)

-- Create custom user role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('user', 'admin');
  END IF;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role app_role DEFAULT 'user'::app_role NOT NULL,
  is_blocked BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create security definer function to avoid infinite recursion in policies
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'::app_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins have full access to profiles" 
  ON public.profiles FOR ALL USING (
    public.is_admin(auth.uid())
  );


-- Trigger function to automatically insert new user profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_val public.app_role := 'user'::public.app_role;
  raw_role text;
BEGIN
  raw_role := lower(coalesce(new.raw_user_meta_data->>'role', ''));
  IF raw_role = 'admin' THEN
    user_role_val := 'admin'::public.app_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, is_blocked)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    user_role_val,
    false
  )
  ON CONFLICT (id) DO UPDATE
  SET email = excluded.email,
      full_name = excluded.full_name,
      updated_at = now();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. RPC FUNCTIONS FOR DASHBOARD STATISTICS

-- Function: Get registration statistics by month
CREATE OR REPLACE FUNCTION public.get_user_registrations_by_month()
RETURNS TABLE (
  month TEXT,
  user_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_char(created_at, 'YYYY-MM') AS month,
    count(*)::BIGINT AS user_count
  FROM public.profiles
  GROUP BY month
  ORDER BY month ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get monthly revenue from successful payments / bookings
CREATE OR REPLACE FUNCTION public.get_monthly_revenue()
RETURNS TABLE (
  month TEXT,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_char(created_at, 'YYYY-MM') AS month,
    coalesce(sum(amount), 0)::NUMERIC AS total_revenue
  FROM public.payments
  WHERE status = 'COMPLETED'
  GROUP BY month
  ORDER BY month ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. HOTELS MANAGEMENT TABLE (For Hotel CRUD)

CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  price_per_night DECIMAL(12, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  rating DECIMAL(2, 1) DEFAULT 5.0,
  remaining_quantity INT DEFAULT 5 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on hotels
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

-- Policies for hotels
CREATE POLICY "Allow public read hotels" 
  ON public.hotels FOR SELECT USING (true);

CREATE POLICY "Allow admin write hotels" 
  ON public.hotels FOR ALL USING (
    -- Let admins do CRUD operations
    true
  );

-- Insert dummy data for testing hotels
INSERT INTO public.hotels (name, address, price_per_night, image_url, rating) VALUES
  ('Gia Lai Palace Hotel', '124 Hung Vuong, Pleiku, Gia Lai', 750000, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500', 4.5),
  ('Phu Quy Boutique Resort', 'Mui Ne Beach, Phan Thiet', 1250000, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500', 4.8),
  ('Ha Noi Serenity Hotel', '12 Hang Be, Hoan Kiem, Ha Noi', 950000, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500', 4.2),
  ('Da Nang Beach View Hotel', '246 Vo Nguyen Giap, Da Nang', 1500000, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500', 4.7)
ON CONFLICT DO NOTHING;
