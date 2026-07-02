// src/utils/incident-helper.ts

import { INCIDENT_WORKFLOW, FOUND_ITEM_WORKFLOW, GUEST_LOST_ITEM_WORKFLOW, INCIDENT_TYPES } from '@/contains/incident';

/**
 * Tạo mã sự cố tự động (VD: INC-20231201-1A2B)
 */
export function generateIncidentCode(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `INC-${yyyy}${mm}${dd}-${randomStr}`;
}

/**
 * Kiểm tra xem việc chuyển trạng thái có hợp lệ theo workflow không
 */
export function isValidStatusTransition(
  incidentType: string,
  currentStatus: string,
  newStatus: string
): boolean {
  let allowedNextStatuses: string[] = [];

  if (incidentType === INCIDENT_TYPES.FOUND_ITEM) {
    allowedNextStatuses = FOUND_ITEM_WORKFLOW[currentStatus] || [];
  } else if (incidentType === INCIDENT_TYPES.GUEST_LOST_ITEM) {
    allowedNextStatuses = GUEST_LOST_ITEM_WORKFLOW[currentStatus] || [];
  } else {
    // Dùng chung workflow cho Damage, Missing, Maintenance...
    allowedNextStatuses = INCIDENT_WORKFLOW[currentStatus] || [];
  }

  return allowedNextStatuses.includes(newStatus);
}