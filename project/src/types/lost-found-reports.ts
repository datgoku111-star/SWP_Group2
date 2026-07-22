import { z } from "zod";
import type { UserRole } from "@/types/hotel";

// Trạng thái của báo cáo đồ thất lạc
export type LostFoundReportStatus =
  | "PENDING_RECEPTIONIST"
  | "CONFIRMED_BY_RECEPTIONIST"
  | "REQUEST_MORE_INFO"
  | "REJECTED"
  | "UNDER_INVESTIGATION"
  | "FOUND"
  | "NOT_FOUND"
  | "RETURNED_TO_CUSTOMER"
  | "CLOSED";

// Cấu trúc dữ liệu báo cáo đồ thất lạc
export interface LostFoundReport {
  id: string;
  user_id: string;
  booking_id?: string | null;
  room_id?: string | null;
  item_name: string;
  description?: string | null;
  lost_location?: string | null;
  lost_at?: string | null;
  image_url?: string | null;
  contact_phone: string;
  status: LostFoundReportStatus;
  receptionist_id?: string | null;
  receptionist_note?: string | null;
  receptionist_confirmed_at?: string | null;
  admin_id?: string | null;
  assigned_staff_name?: string | null;
  admin_note?: string | null;
  found_at?: string | null;
  returned_at?: string | null;
  created_at: string;
  updated_at: string;
  // Metadata mở rộng khi join
  user_name?: string;
  user_email?: string;
  room_number?: string;
  receptionist_name?: string;
  admin_name?: string;
}

// Cấu trúc lịch sử thay đổi trạng thái
export interface LostFoundStatusHistory {
  id: string;
  report_id: string;
  old_status?: LostFoundReportStatus | null;
  new_status: LostFoundReportStatus;
  actor_id?: string | null;
  actor_role: UserRole | string;
  note?: string | null;
  created_at: string;
  actor_name?: string;
}

// Zod Schema Customer tạo báo cáo mới
export const CreateLostFoundReportSchema = z.object({
  item_name: z.string().min(2, "Tên đồ vật không được để trống (ít nhất 2 ký tự)"),
  description: z.string().optional().nullable(),
  lost_location: z.string().optional().nullable(),
  lost_at: z.string().optional().nullable(),
  booking_id: z.string().optional().nullable().or(z.literal("")),
  room_id: z.string().optional().nullable().or(z.literal("")),
  image_url: z.string().optional().nullable().or(z.literal("")),
  contact_phone: z.string().optional().nullable().or(z.literal("")),
});

export type CreateLostFoundReportInput = z.infer<typeof CreateLostFoundReportSchema>;

// Zod Schema Customer cập nhật bổ sung thông tin khi có yêu cầu
export const UpdateLostFoundReportCustomerSchema = CreateLostFoundReportSchema.partial();
export type UpdateLostFoundReportCustomerInput = z.infer<typeof UpdateLostFoundReportCustomerSchema>;

// Zod Schema Receptionist xử lý báo cáo
export const ReceptionistActionSchema = z.object({
  action: z.enum(["CONFIRMED", "REJECTED", "REQUEST_MORE_INFO"], {
    required_error: "Hành động xử lý không hợp lệ",
  }),
  note: z.string().optional().nullable(),
}).refine(
  (data) => {
    if ((data.action === "REJECTED" || data.action === "REQUEST_MORE_INFO") && (!data.note || data.note.trim() === "")) {
      return false;
    }
    return true;
  },
  {
    message: "Vui lòng nhập lý do/ghi chú khi Từ chối hoặc Yêu cầu bổ sung thông tin",
    path: ["note"],
  }
);

export type ReceptionistActionInput = z.infer<typeof ReceptionistActionSchema>;

// Zod Schema Admin quản lý cập nhật trạng thái
export const AdminActionSchema = z.object({
  status: z.enum(
    [
      "UNDER_INVESTIGATION",
      "FOUND",
      "NOT_FOUND",
      "RETURNED_TO_CUSTOMER",
      "CLOSED",
    ],
    { required_error: "Trạng thái không hợp lệ" }
  ),
  assigned_staff_name: z.string().optional().nullable(),
  admin_note: z.string().optional().nullable(),
});

export type AdminActionInput = z.infer<typeof AdminActionSchema>;
