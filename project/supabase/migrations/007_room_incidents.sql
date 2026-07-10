-- 1. Tạo các kiểu ENUM cho loại sự cố và trạng thái xử lý nếu chưa tồn tại
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_type') THEN
        CREATE TYPE incident_type AS ENUM ('LOST_ITEM', 'DAMAGE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_status') THEN
        CREATE TYPE incident_status AS ENUM ('PENDING', 'RESOLVED');
    END IF;
END $$;

-- 2. Tạo bảng quản lý sự cố sự vụ trong phòng
CREATE TABLE IF NOT EXISTS public.room_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    type incident_type NOT NULL,
    description TEXT NOT NULL,
    fine_amount NUMERIC(15, 2) DEFAULT 0.00 CHECK (fine_amount >= 0),
    status incident_status DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Cấu hình Realtime để đồng bộ giao diện lập tức
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_incidents;