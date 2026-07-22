-- ==============================================================================
-- MODULE: CUSTOMER LOST & FOUND REPORTS MANAGEMENT
-- MIGRATION 010: lost_found_reports & lost_found_status_history
-- ==============================================================================

-- 1. BẢNG BÁO CÁO ĐỒ THẤT LẠC CỦA KHÁCH HÀNG (lost_found_reports)
CREATE TABLE IF NOT EXISTS lost_found_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    description TEXT,
    lost_location TEXT,
    lost_at TIMESTAMP WITH TIME ZONE,
    image_url TEXT,
    contact_phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING_RECEPTIONIST',
    receptionist_id UUID REFERENCES users(id) ON DELETE SET NULL,
    receptionist_note TEXT,
    receptionist_confirmed_at TIMESTAMP WITH TIME ZONE,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_staff_name TEXT,
    admin_note TEXT,
    found_at TIMESTAMP WITH TIME ZONE,
    returned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT chk_lost_found_reports_status CHECK (
        status IN (
            'PENDING_RECEPTIONIST',
            'CONFIRMED_BY_RECEPTIONIST',
            'REQUEST_MORE_INFO',
            'REJECTED',
            'UNDER_INVESTIGATION',
            'FOUND',
            'NOT_FOUND',
            'RETURNED_TO_CUSTOMER',
            'CLOSED'
        )
    )
);

-- 2. BẢNG LỊCH SỬ THAY ĐỔI TRẠNG THÁI (lost_found_status_history)
CREATE TABLE IF NOT EXISTS lost_found_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES lost_found_reports(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INDEX ĐỂ TỐI ƯU TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_lost_found_reports_user_id ON lost_found_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_reports_status ON lost_found_reports(status);
CREATE INDEX IF NOT EXISTS idx_lost_found_reports_created_at ON lost_found_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lost_found_reports_booking_id ON lost_found_reports(booking_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_reports_room_id ON lost_found_reports(room_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_status_history_report_id ON lost_found_status_history(report_id);

-- 4. TRIGGER TỰ ĐỘNG CẬP NHẬT UPDATED_AT
CREATE OR REPLACE FUNCTION update_lost_found_reports_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_lost_found_reports_timestamp ON lost_found_reports;
CREATE TRIGGER trg_update_lost_found_reports_timestamp
BEFORE UPDATE ON lost_found_reports
FOR EACH ROW
EXECUTE FUNCTION update_lost_found_reports_timestamp();

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE lost_found_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_found_status_history ENABLE ROW LEVEL SECURITY;

-- Dynamic RLS Policies
-- Customer readable: items created by user
CREATE POLICY "Customer view own reports"
ON lost_found_reports FOR SELECT
USING (auth.uid() = user_id OR auth.jwt() ->> 'role' IN ('RECEPTIONIST', 'ADMIN'));

-- Customer insert: items with own user_id
CREATE POLICY "Customer insert own report"
ON lost_found_reports FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' IN ('RECEPTIONIST', 'ADMIN'));

-- Customer update: own reports when PENDING_RECEPTIONIST or REQUEST_MORE_INFO
CREATE POLICY "Customer update own report"
ON lost_found_reports FOR UPDATE
USING (
    (auth.uid() = user_id AND status IN ('PENDING_RECEPTIONIST', 'REQUEST_MORE_INFO'))
    OR auth.jwt() ->> 'role' IN ('RECEPTIONIST', 'ADMIN')
);

-- Receptionist & Admin full access for status history
CREATE POLICY "Select status history policy"
ON lost_found_status_history FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM lost_found_reports r
        WHERE r.id = report_id AND (r.user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('RECEPTIONIST', 'ADMIN'))
    )
);

CREATE POLICY "Insert status history policy"
ON lost_found_status_history FOR INSERT
WITH CHECK (true);
