// src/types/incident.ts

import { z } from 'zod';
import { INCIDENT_TYPES, INCIDENT_SEVERITY } from '@/contains/incident';

const IncidentTypeEnum = z.nativeEnum(INCIDENT_TYPES);
const IncidentSeverityEnum = z.nativeEnum(INCIDENT_SEVERITY);

// Schema validate khi tạo Incident mới
export const CreateIncidentSchema = z.object({
  booking_id: z.string().uuid().optional().nullable(),
  room_id: z.string().uuid(),
  customer_id: z.string().uuid().optional().nullable(),
  assigned_to_user_id: z.string().uuid().optional().nullable(),
  incident_type: IncidentTypeEnum,
  severity: IncidentSeverityEnum,
  description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  detailed_note: z.string().optional(),
  estimated_charge: z.number().min(0).default(0),
  is_chargeable: z.boolean().default(false),
  expected_completion_at: z.string().datetime().optional(),
});

// Schema validate khi update Status
export const UpdateIncidentStatusSchema = z.object({
  new_status: z.string(),
  note: z.string().min(5, 'Vui lòng nhập ghi chú khi đổi trạng thái'),
});

// Xuất type để dùng cho Frontend & Backend
export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>;
export type UpdateIncidentStatusInput = z.infer<typeof UpdateIncidentStatusSchema>;
export type IncidentType = keyof typeof INCIDENT_TYPES;
export type IncidentSeverity = keyof typeof INCIDENT_SEVERITY;

// Interface mô phỏng cấu trúc trả về từ Database (Supabase)
export interface RoomIncident {
  id: string;
  incident_code: string;
  booking_id: string | null;
  room_id: string;
  customer_id: string | null;
  reported_by_user_id: string;
  assigned_to_user_id: string | null;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  detailed_note: string | null;
  estimated_charge: number;
  approved_charge: number;
  actual_charge: number;
  is_chargeable: boolean;
  status: string;
  incident_time: string;
  expected_completion_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}