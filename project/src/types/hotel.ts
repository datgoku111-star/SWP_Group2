// ============================================================
// HSRM — Hotel Operation and Service Management System Types
// ============================================================

// ---------- Enums ----------

export type UserRole =
  | "ADMIN"
  | "RECEPTIONIST"
  | "HOUSEKEEPING"
  | "KITCHEN"
  | "CUSTOMER";

export type RoomStatus = "AVAILABLE" | "IN_USE" | "DIRTY" | "MAINTENANCE";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED";

export type ServiceCategory =
  | "FOOD"
  | "BEVERAGE"
  | "LAUNDRY"
  | "AMENITY"
  | "OTHER";

export type OrderStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "MOMO" | "VNPAY";

export type PaymentStatus = "PENDING" | "COMPLETED" | "REFUNDED";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "BOOKING_CREATE"
  | "BOOKING_UPDATE"
  | "CHECK_IN"
  | "CHECK_OUT"
  | "ROOM_STATUS_CHANGE"
  | "ORDER_CREATE"
  | "ORDER_STATUS_CHANGE"
  | "PAYMENT_CREATE"
  | "USER_CREATE"
  | "USER_UPDATE";

// ---------- Database Row Interfaces ----------

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  loyalty_points: number;  
}
/** User without password hash — safe for client */
export type SafeUser = Omit<User, "password_hash">;

export interface Guest {
  id: string;
  full_name: string;
  id_card_number?: string;
  id_card_type?: string;
  phone?: string;
  email?: string;
  nationality?: string;
  address?: string;
  created_at: string;
}

export interface RoomType {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  max_occupancy: number;
  amenities: string[];
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  room_number: string;
  floor: number;
  room_type_id: string;
  status: RoomStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined
  room_type?: RoomType;
}

export interface Booking {
  id: string;
  user_id: string;
  room_id: string;
  guest_id?: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  status: BookingStatus;
  total_amount: number;
  special_requests?: string;
  created_at: string;
  updated_at: string;
  // Joined
  room?: Room;
  user?: SafeUser;
  guest?: Guest;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  category: ServiceCategory;
  price: number;
  is_available: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceOrder {
  id: string;
  booking_id: string;
  status: OrderStatus;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined
  items?: ServiceOrderItem[];
  booking?: Booking;
}

export interface ServiceOrderItem {
  id: string;
  order_id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  // Joined
  service?: Service;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_ref?: string;
  created_at: string;
  // Joined
  booking?: Booking;
}

export interface Staff {
  id: string;
  user_id: string;
  department?: string;
  shift?: string;
  hire_date?: string;
  created_at: string;
  updated_at: string;
  // Joined
  user?: SafeUser;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

// ---------- API Request/Response Types ----------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: SafeUser;
  message: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface CreateBookingRequest {
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  special_requests?: string;
}

export interface CheckInRequest {
  booking_id: string;
  guest: {
    full_name: string;
    id_card_number: string;
    id_card_type: string;
    phone?: string;
    email?: string;
    nationality?: string;
    address?: string;
  };
}

export interface CheckOutRequest {
  payment_method: PaymentMethod;
  amount: number;
  transaction_ref?: string;
}

export interface CreateServiceOrderRequest {
  booking_id: string;
  items: {
    service_id: string;
    quantity: number;
  }[];
  notes?: string;
}

export interface InvoiceData {
  booking: Booking;
  room_charges: number;
  service_charges: {
    order_id: string;
    items: ServiceOrderItem[];
    total: number;
  }[];
  incident_charges?: {
    incidents: any[];
    total_fine: number;
  };
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  grand_total: number;
  payments: Payment[];
  balance_due: number;
}

export interface DashboardStats {
  total_rooms: number;
  occupied_rooms: number;
  available_rooms: number;
  todays_arrivals: number;
  todays_departures: number;
  pending_orders: number;
  revenue_today: number;
  occupancy_rate: number;
}

export interface OcrResult {
  full_name: string;
  id_card_number: string;
  id_card_type: string;
  nationality?: string;
  address?: string;
  confidence: number;
}

 
export type IncidentType = "LOST_ITEM" | "DAMAGE";
export type IncidentStatus = "PENDING" | "RESOLVED";

export interface RoomIncident {
  id: string;
  room_id: string;
  booking_id: string;
  reporter_id: string | null;
  type: IncidentType;
  description: string;
  fine_amount: number;
  status: IncidentStatus;
  created_at: string;
  resolved_at: string | null;
  updated_at: string;
  room?: Room;
  booking?: Booking;
}