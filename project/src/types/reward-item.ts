import { z } from 'zod';

// Schema validate khi Admin tạo phần quà mới trong kho
export const RewardItemSchema = z.object({
  title: z.string().min(2, 'Tên phần quà không được để trống'),
  description: z.string().optional(),
  points_required: z.number().int().positive('Số điểm yêu cầu phải lớn hơn 0'),
  stock_quantity: z.number().int().nonnegative('Số lượng kho không được âm').default(999),
  is_active: z.boolean().default(true),
});

export type RewardItemInput = z.infer<typeof RewardItemSchema>;

export interface RewardItem {
  id: string;
  title: string;
  description: string | null;
  points_required: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
}