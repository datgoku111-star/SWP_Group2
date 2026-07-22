import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import type { JwtPayload } from "@/lib/auth";
import type { UserRole } from "@/types/hotel";

export interface AuthCheckResult {
  user: JwtPayload | null;
  errorResponse: NextResponse | null;
}

/**
 * Kiểm tra người dùng đã đăng nhập và thuộc các vai trò được phép hay chưa.
 * Trả về user session hoặc NextResponse chứa lỗi 401/403.
 */
export async function verifyAuthAndRole(
  allowedRoles?: UserRole[]
): Promise<AuthCheckResult> {
  const user = await getCurrentUser();

  if (!user || !user.sub) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn" },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      user,
      errorResponse: NextResponse.json(
        { error: "Bạn không có quyền thực hiện thao tác này" },
        { status: 403 }
      ),
    };
  }

  return { user, errorResponse: null };
}

/**
 * Kiểm tra xem Customer có quyền truy cập/chỉnh sửa báo cáo của chính mình không.
 */
export function isOwnerOrStaff(userId: string, reportUserId: string, userRole: UserRole): boolean {
  if (userRole === "ADMIN" || userRole === "RECEPTIONIST") return true;
  return userId === reportUserId;
}
