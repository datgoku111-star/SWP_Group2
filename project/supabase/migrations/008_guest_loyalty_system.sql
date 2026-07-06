-- 1. Thêm cột loyalty_points trực tiếp vào bảng profiles có sẵn của hệ thống
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS loyalty_points INT DEFAULT 0 CHECK (loyalty_points >= 0);

-- 2. Cập nhật lại trigger function handle_new_user() để tự động khởi tạo 0 điểm khi có tài khoản mới
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, loyalty_points)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Khách hàng mới'),
    new.email,
    0
  )
  ON CONFLICT (id) DO UPDATE
  SET loyalty_points = EXCLUDED.loyalty_points;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;