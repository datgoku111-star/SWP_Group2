import { z } from 'zod';

// Schema validate khi tạo dữ liệu đồ thất lạc mới
export const CreateLostFoundSchema = z.object({
  item_name: z.string().min(2, 'Tên đồ vật không được để trống'),
  item_category: z.string().optional(),
  room_id: z.string().uuid('ID Phòng không hợp lệ').optional().nullable(),
  where_found: z.string().optional(),
  storage_location: z.string().optional(),
  description: z.string().optional(),
  estimated_value: z.number().min(0).optional().default(0),
});

export type CreateLostFoundInput = z.infer<typeof CreateLostFoundSchema>;

// Interface cho Frontend
export interface LostFoundItem {
  id: string;
  item_code: string;
  item_name: string;
  item_category: string | null;
  room_id: string | null;
  where_found: string | null;
  storage_location: string | null;
  status: string;
  found_at: string;
  created_at: string;
}