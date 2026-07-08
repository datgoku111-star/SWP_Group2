import { z } from 'zod';

// 1. Phân hạng thành viên hợp lệ
export const MEMBERSHIP_LEVELS = {
  STANDARD: 'STANDARD',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  DIAMOND: 'DIAMOND',
} as const;

// 2. Các loại giao dịch điểm thưởng
export const POINT_TRANSACTION_TYPES = {
  EARNED: 'EARNED',
  REDEEMED: 'REDEEMED',
  REFUNDED: 'REFUNDED',
} as const;

// 3. Schema validate khi tạo/sửa hồ sơ khách hàng
export const CustomerProfileSchema = z.object({
  full_name: z.string().min(2, 'Tên khách hàng không được để trống'),
  email: z.string().email('Email không đúng định dạng').optional().or(z.literal('')),
  phone: z.string().min(10, 'Số điện thoại phải từ 10 số trở lên').optional().or(z.literal('')),
  preferences_notes: z.string().optional(),
  membership_level: z.nativeEnum(MEMBERSHIP_LEVELS).default('STANDARD'),
});

export type CustomerProfileInput = z.infer<typeof CustomerProfileSchema>;

// 4. Schema validate khi thực hiện giao dịch điểm (Tích/Tiêu điểm)
export const PointsTransactionSchema = z.object({
  customer_id: z.string().uuid('ID khách hàng không hợp lệ'),
  booking_id: z.string().uuid('ID đơn đặt phòng không hợp lệ').optional().nullable(),
  reward_item_id: z.string().uuid('ID phần quà không hợp lệ').optional().nullable(),
  transaction_type: z.nativeEnum(POINT_TRANSACTION_TYPES),
  points_changed: z.number().int().refine((val) => val !== 0, 'Số điểm thay đổi phải khác 0'),
  reason: z.string().min(5, 'Vui lòng nhập lý do biến động điểm cụ thể'),
});

export type PointsTransactionInput = z.infer<typeof PointsTransactionSchema>;

// 5. Interface dùng để hiển thị dữ liệu khách hàng ở Frontend
export interface CustomerProfile {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  membership_level: keyof typeof MEMBERSHIP_LEVELS;
  current_points: number;
  total_accumulated_points: number;
  total_spent: number;
  preferences_notes: string | null;
  created_at: string;
  updated_at: string;
}