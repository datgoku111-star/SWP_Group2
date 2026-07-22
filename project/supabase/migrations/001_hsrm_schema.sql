-- ============================================================
-- HSRM Database Schema Migration
-- Hotel Operation and Service Management System
-- ============================================================

-- Enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'RECEPTIONIST', 'HOUSEKEEPING', 'KITCHEN', 'CUSTOMER');
CREATE TYPE room_status AS ENUM ('AVAILABLE', 'IN_USE', 'DIRTY', 'CLEANING', 'MAINTENANCE');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');
CREATE TYPE service_category AS ENUM ('FOOD', 'BEVERAGE', 'LAUNDRY', 'AMENITY', 'OTHER');
CREATE TYPE order_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE payment_method AS ENUM ('CASH', 'CARD', 'TRANSFER', 'MOMO', 'VNPAY');
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED');

-- ============================================================
-- TABLES
-- ============================================================

-- Users (staff + customers)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role user_role DEFAULT 'CUSTOMER' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Guests (hotel visitor profiles)
CREATE TABLE guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  id_card_number VARCHAR(50),
  id_card_type VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(255),
  nationality VARCHAR(100),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_guests_id_card ON guests(id_card_number);

-- Room types
CREATE TABLE room_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  base_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  max_occupancy INT NOT NULL DEFAULT 2,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Physical rooms
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number VARCHAR(10) UNIQUE NOT NULL,
  floor INT NOT NULL DEFAULT 1,
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
  bed_type VARCHAR(20) DEFAULT 'SINGLE',
  status room_status DEFAULT 'AVAILABLE' NOT NULL,
  status_updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_floor ON rooms(floor);

-- Bookings
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  guest_id UUID REFERENCES guests(id),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  num_guests INT NOT NULL DEFAULT 1,
  status booking_status DEFAULT 'PENDING' NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT chk_dates CHECK (check_out_date > check_in_date)
);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_room ON bookings(room_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);

-- Services catalog
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category service_category NOT NULL,
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  is_available BOOLEAN DEFAULT true NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_services_category ON services(category);

-- Service orders
CREATE TABLE service_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  status order_status DEFAULT 'PENDING' NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_service_orders_booking ON service_orders(booking_id);
CREATE INDEX idx_service_orders_status ON service_orders(status);

-- Service order items
CREATE TABLE service_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL
);
CREATE INDEX idx_order_items_order ON service_order_items(order_id);

-- Payments
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  amount DECIMAL(12, 2) NOT NULL,
  method payment_method NOT NULL,
  status payment_status DEFAULT 'PENDING' NOT NULL,
  transaction_ref VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_payments_booking ON payments(booking_id);

-- Staff profiles
CREATE TABLE staffs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department VARCHAR(100),
  shift VARCHAR(50),
  hire_date DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION is_room_available(
  p_room_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE room_id = p_room_id
      AND status IN ('CONFIRMED', 'CHECKED_IN')
      AND check_in_date < p_check_out
      AND check_out_date > p_check_in
      AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DATA
-- ============================================================

-- All seed users use password: admin123
INSERT INTO users (email, password_hash, full_name, phone, role) VALUES
  ('admin@hotel.com', '$2a$12$LJ3MFgFJJgSx1YhSKS1SXOzFvOQHkUMQcJqnhuS2q5fZpbpVMwKi6', 'Hotel Admin', '0901234567', 'ADMIN'),
  ('reception@hotel.com', '$2a$12$LJ3MFgFJJgSx1YhSKS1SXOzFvOQHkUMQcJqnhuS2q5fZpbpVMwKi6', 'Reception Staff', '0901234568', 'RECEPTIONIST'),
  ('housekeeper@hotel.com', '$2a$12$LJ3MFgFJJgSx1YhSKS1SXOzFvOQHkUMQcJqnhuS2q5fZpbpVMwKi6', 'Housekeeper', '0901234569', 'HOUSEKEEPING'),
  ('kitchen@hotel.com', '$2a$12$LJ3MFgFJJgSx1YhSKS1SXOzFvOQHkUMQcJqnhuS2q5fZpbpVMwKi6', 'Kitchen Staff', '0901234570', 'KITCHEN'),
  ('customer@hotel.com', '$2a$12$LJ3MFgFJJgSx1YhSKS1SXOzFvOQHkUMQcJqnhuS2q5fZpbpVMwKi6', 'Nguyen Van A', '0901234571', 'CUSTOMER');

INSERT INTO room_types (name, description, base_price, max_occupancy, amenities, images) VALUES
  ('Standard', 'Comfortable room with essential amenities', 500000, 2, ARRAY['Wi-Fi', 'AC', 'TV', 'Mini-bar'], ARRAY['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800']),
  ('Deluxe', 'Spacious room with city view', 900000, 2, ARRAY['Wi-Fi', 'AC', 'TV', 'Mini-bar', 'Bathtub', 'City View'], ARRAY['https://images.unsplash.com/photo-1590490360182-c33d955e0ae9?w=800']),
  ('Suite', 'Luxury suite with living area', 1500000, 4, ARRAY['Wi-Fi', 'AC', 'TV', 'Mini-bar', 'Bathtub', 'City View', 'Living Room', 'Kitchen'], ARRAY['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800']),
  ('Family', 'Perfect for families with extra beds', 1200000, 6, ARRAY['Wi-Fi', 'AC', 'TV', 'Mini-bar', 'Extra Beds', 'Kids Corner'], ARRAY['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800']);

INSERT INTO rooms (room_number, floor, room_type_id, bed_type, status) VALUES
  -- Standard (7 rooms)
  ('101', 1, (SELECT id FROM room_types WHERE name = 'Standard'), 'SINGLE', 'AVAILABLE'),
  ('102', 1, (SELECT id FROM room_types WHERE name = 'Standard'), 'SINGLE', 'AVAILABLE'),
  ('103', 1, (SELECT id FROM room_types WHERE name = 'Standard'), 'DOUBLE', 'AVAILABLE'),
  ('201', 2, (SELECT id FROM room_types WHERE name = 'Standard'), 'SINGLE', 'AVAILABLE'),
  ('202', 2, (SELECT id FROM room_types WHERE name = 'Standard'), 'DOUBLE', 'AVAILABLE'),
  ('301', 3, (SELECT id FROM room_types WHERE name = 'Standard'), 'SINGLE', 'AVAILABLE'),
  ('401', 4, (SELECT id FROM room_types WHERE name = 'Standard'), 'DOUBLE', 'AVAILABLE'),

  -- Deluxe (7 rooms)
  ('104', 1, (SELECT id FROM room_types WHERE name = 'Deluxe'), 'SINGLE', 'AVAILABLE'),
  ('105', 1, (SELECT id FROM room_types WHERE name = 'Deluxe'), 'DOUBLE', 'AVAILABLE'),
  ('203', 2, (SELECT id FROM room_types WHERE name = 'Deluxe'), 'SINGLE', 'AVAILABLE'),
  ('204', 2, (SELECT id FROM room_types WHERE name = 'Deluxe'), 'DOUBLE', 'AVAILABLE'),
  ('302', 3, (SELECT id FROM room_types WHERE name = 'Deluxe'), 'SINGLE', 'AVAILABLE'),
  ('303', 3, (SELECT id FROM room_types WHERE name = 'Deluxe'), 'DOUBLE', 'AVAILABLE'),
  ('402', 4, (SELECT id FROM room_types WHERE name = 'Deluxe'), 'DOUBLE', 'AVAILABLE'),

  -- Suite (7 rooms)
  ('106', 1, (SELECT id FROM room_types WHERE name = 'Suite'), 'DOUBLE', 'AVAILABLE'),
  ('205', 2, (SELECT id FROM room_types WHERE name = 'Suite'), 'SINGLE', 'AVAILABLE'),
  ('206', 2, (SELECT id FROM room_types WHERE name = 'Suite'), 'DOUBLE', 'AVAILABLE'),
  ('304', 3, (SELECT id FROM room_types WHERE name = 'Suite'), 'SINGLE', 'AVAILABLE'),
  ('305', 3, (SELECT id FROM room_types WHERE name = 'Suite'), 'DOUBLE', 'AVAILABLE'),
  ('403', 4, (SELECT id FROM room_types WHERE name = 'Suite'), 'DOUBLE', 'AVAILABLE'),
  ('404', 4, (SELECT id FROM room_types WHERE name = 'Suite'), 'SINGLE', 'AVAILABLE'),

  -- Family (7 rooms)
  ('107', 1, (SELECT id FROM room_types WHERE name = 'Family'), 'DOUBLE', 'AVAILABLE'),
  ('207', 2, (SELECT id FROM room_types WHERE name = 'Family'), 'DOUBLE', 'AVAILABLE'),
  ('208', 2, (SELECT id FROM room_types WHERE name = 'Family'), 'DOUBLE', 'AVAILABLE'),
  ('306', 3, (SELECT id FROM room_types WHERE name = 'Family'), 'DOUBLE', 'AVAILABLE'),
  ('307', 3, (SELECT id FROM room_types WHERE name = 'Family'), 'DOUBLE', 'AVAILABLE'),
  ('405', 4, (SELECT id FROM room_types WHERE name = 'Family'), 'DOUBLE', 'AVAILABLE'),
  ('406', 4, (SELECT id FROM room_types WHERE name = 'Family'), 'DOUBLE', 'AVAILABLE');

INSERT INTO services (name, description, category, price, is_available) VALUES
  ('Pho Bo', 'Traditional Vietnamese beef noodle soup', 'FOOD', 75000, true),
  ('Com Tam', 'Broken rice with grilled pork', 'FOOD', 65000, true),
  ('Banh Mi', 'Vietnamese baguette sandwich', 'FOOD', 35000, true),
  ('Club Sandwich', 'Triple-decker club sandwich', 'FOOD', 95000, true),
  ('Steak & Fries', 'Grilled ribeye with fries', 'FOOD', 250000, true),
  ('Ca Phe Sua Da', 'Vietnamese iced coffee with milk', 'BEVERAGE', 35000, true),
  ('Fresh Juice', 'Seasonal fruit juice', 'BEVERAGE', 45000, true),
  ('Beer Tiger', 'Tiger beer 330ml', 'BEVERAGE', 40000, true),
  ('Wine House Red', 'House red wine by glass', 'BEVERAGE', 120000, true),
  ('Laundry - Shirt', 'Shirt washing and ironing', 'LAUNDRY', 30000, true),
  ('Laundry - Pants', 'Pants washing and ironing', 'LAUNDRY', 35000, true),
  ('Laundry - Suit', 'Full suit dry cleaning', 'LAUNDRY', 150000, true),
  ('Extra Towels', 'Set of bath towels', 'AMENITY', 0, true),
  ('Extra Pillows', 'Additional pillows', 'AMENITY', 0, true),
  ('Airport Transfer', 'One-way airport shuttle', 'OTHER', 350000, true),
  ('Spa - Thai Massage', '60-minute Thai massage', 'OTHER', 500000, true);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read room_types" ON room_types FOR SELECT USING (true);
CREATE POLICY "Public read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Public read services" ON services FOR SELECT USING (is_available = true);
