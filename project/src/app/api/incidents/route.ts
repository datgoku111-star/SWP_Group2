import { NextResponse } from 'next/server';
import { CreateIncidentSchema } from '@/types/incident';
import { generateIncidentCode } from '@/utils/incident-helper';
import { INCIDENT_STATUS } from '@/contains/incident';
import { supabaseServer as supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await request.json();

    // 1. Validate payload bằng Zod
    const validatedData = CreateIncidentSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: validatedData.error.format() },
        { status: 400 }
      );
    }

    const data = validatedData.data;
    const incidentCode = generateIncidentCode();
    const currentUserId = user.id;
    
    // 2. Insert vào bảng room_incidents
    const { data: newIncident, error: incidentError } = await supabase
      .from('room_incidents')
      .insert({
        incident_code: incidentCode,
        booking_id: data.booking_id,
        room_id: data.room_id,
        customer_id: data.customer_id,
        reported_by_user_id: currentUserId,
        assigned_to_user_id: data.assigned_to_user_id,
        incident_type: data.incident_type,
        severity: data.severity,
        description: data.description,
        detailed_note: data.detailed_note,
        estimated_charge: data.estimated_charge,
        is_chargeable: data.is_chargeable,
        expected_completion_at: data.expected_completion_at,
        status: INCIDENT_STATUS.REPORTED,
      })
      .select('id')
      .single();

    if (incidentError || !newIncident) {
      console.error('Lỗi tạo sự cố:', incidentError);
      return NextResponse.json({ error: 'Lỗi server khi tạo sự cố' }, { status: 500 });
    }

    // 3. Ghi log khởi tạo vào incident_history
    await supabase.from('incident_history').insert({
      incident_id: newIncident.id,
      action: 'CREATED',
      new_status: INCIDENT_STATUS.REPORTED,
      note: 'Khởi tạo báo cáo sự cố',
      changed_by_user_id: currentUserId,
    });

    return NextResponse.json(
      { message: 'Tạo sự cố thành công', data: { id: newIncident.id, incident_code: incidentCode } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Lỗi API POST /api/incidents:', error);
    return NextResponse.json({ error: 'Đã có lỗi bất ngờ xảy ra' }, { status: 500 });
  }
}