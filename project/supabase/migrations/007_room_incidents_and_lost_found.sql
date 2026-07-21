-- ==============================================================================
-- MODULE: ROOM INCIDENT & LOST FOUND MANAGEMENT
-- TẠO MỚI CÁC BẢNG (KHÔNG SỬA BẢNG CŨ)
-- ==============================================================================

-- Lưu ý quan trọng: 
-- Script này giả định các cột khóa chính (id) của bảng bookings, rooms, users là UUID. 
-- Nếu database hiện tại của bạn dùng BIGINT (số nguyên), hãy đổi UUID ở các khóa ngoại thành BIGINT.

-- 1. BẢNG QUẢN LÝ SỰ CỐ (ROOM INCIDENTS)
CREATE TABLE room_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_code VARCHAR(50) UNIQUE NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reported_by_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    incident_type VARCHAR(50) NOT NULL, -- DAMAGE, MISSING_HOTEL_ITEM, GUEST_LOST_ITEM, FOUND_ITEM, MAINTENANCE, COMPLAINT, OTHER
    severity VARCHAR(20) NOT NULL,      -- LOW, MEDIUM, HIGH, CRITICAL
    description TEXT NOT NULL,
    detailed_note TEXT,
    estimated_charge DECIMAL(12,2) DEFAULT 0,
    approved_charge DECIMAL(12,2) DEFAULT 0,
    actual_charge DECIMAL(12,2) DEFAULT 0,
    is_chargeable BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) NOT NULL,        -- Dựa theo workflow
    incident_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_completion_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BẢNG CHỨNG CỨ/HÌNH ẢNH (INCIDENT EVIDENCE)
CREATE TABLE incident_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES room_incidents(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    uploaded_by_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BẢNG LỊCH SỬ THAY ĐỔI (INCIDENT HISTORY) - CHỈ GHI THÊM, KHÔNG SỬA/XÓA
CREATE TABLE incident_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES room_incidents(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    note TEXT,
    changed_by_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. BẢNG ĐỒ THẤT LẠC (LOST & FOUND ITEMS)
CREATE TABLE lost_found_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES room_incidents(id) ON DELETE SET NULL,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    found_by_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    item_name VARCHAR(255) NOT NULL,
    item_category VARCHAR(100),
    description TEXT,
    estimated_value DECIMAL(12,2),
    where_found VARCHAR(255),
    found_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    storage_location VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- FOUND, STORED, CUSTOMER_NOTIFIED, CLAIMED, RETURNED, CLOSED, DISPOSED
    customer_notified_at TIMESTAMP WITH TIME ZONE,
    returned_at TIMESTAMP WITH TIME ZONE,
    returned_to_name VARCHAR(255),
    return_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. BẢNG CHI PHÍ BỒI THƯỜNG (INCIDENT COMPENSATIONS)
CREATE TABLE incident_compensations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID UNIQUE REFERENCES room_incidents(id) ON DELETE CASCADE,
    repair_cost DECIMAL(12,2) DEFAULT 0,
    cleaning_fee DECIMAL(12,2) DEFAULT 0,
    replacement_fee DECIMAL(12,2) DEFAULT 0,
    penalty_fee DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    approval_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- TẠO INDEX ĐỂ TỐI ƯU TRUY VẤN
-- ==============================================================================

CREATE INDEX idx_room_incidents_room_id ON room_incidents(room_id);
CREATE INDEX idx_room_incidents_booking_id ON room_incidents(booking_id);
CREATE INDEX idx_room_incidents_customer_id ON room_incidents(customer_id);
CREATE INDEX idx_room_incidents_status ON room_incidents(status);
CREATE INDEX idx_room_incidents_type_severity ON room_incidents(incident_type, severity);
CREATE INDEX idx_room_incidents_created_at ON room_incidents(created_at);

CREATE INDEX idx_lost_found_status ON lost_found_items(status);
CREATE INDEX idx_lost_found_customer ON lost_found_items(customer_id);