import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("room_id");
    const bookingId = searchParams.get("booking_id");

    // Fetch all rooms to check for incident metadata in notes
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*');

    if (roomsError) {
      console.error("GET virtual incidents rooms error:", roomsError);
      return NextResponse.json({ error: roomsError.message }, { status: 500 });
    }

    const incidents: any[] = [];

    for (const room of (rooms || [])) {
      if (room.notes && room.notes.includes('DAMAGE:')) {
        try {
          const parts = room.notes.split('DAMAGE:');
          const jsonStr = parts[1].trim();
          const damageData = JSON.parse(jsonStr);

          // Build virtual incident
          const virtualIncident = {
            id: `incident-${room.id}`,
            incident_code: `INC-${room.room_number}`,
            booking_id: damageData.booking_id || null,
            room_id: room.id,
            customer_id: damageData.customer_id || null,
            reported_by_user_id: damageData.reported_by_user_id || null,
            assigned_to_user_id: null,
            incident_type: 'DAMAGE',
            severity: 'MEDIUM',
            description: damageData.description,
            detailed_note: damageData.detailed_note || null,
            estimated_charge: damageData.estimated_charge || 0,
            approved_charge: damageData.approved_charge || 0,
            actual_charge: damageData.approved_charge || 0,
            is_chargeable: damageData.is_chargeable ?? true,
            status: room.status === 'MAINTENANCE' ? 'REPORTED' : 'RESOLVED',
            incident_time: room.status_updated_at || room.updated_at || new Date().toISOString(),
            expected_completion_at: null,
            resolved_at: room.status === 'AVAILABLE' ? new Date().toISOString() : null,
            created_at: room.created_at,
            updated_at: room.updated_at,
            incident_evidence: damageData.image ? [{ file_url: damageData.image }] : [],
            room: {
              id: room.id,
              room_number: room.room_number,
              floor: room.floor,
              status: room.status
            }
          };

          // Filter filters
          if (roomId && virtualIncident.room_id !== roomId) continue;
          if (bookingId && virtualIncident.booking_id !== bookingId) continue;

          incidents.push(virtualIncident);
        } catch (e) {
          console.error(`Failed to parse incident JSON for room ${room.room_number}:`, e);
        }
      }
    }

    return NextResponse.json(incidents);
  } catch (error: any) {
    console.error("GET virtual incidents catch error:", error);
    return NextResponse.json({ error: error.message || 'Đã có lỗi xảy ra' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await request.json();
    const { room_id, booking_id, description, detailed_note, estimated_charge, evidence_image } = body;

    if (!room_id) {
      return NextResponse.json({ error: 'Thiếu room_id' }, { status: 400 });
    }

    // Fetch original room to retain bed configuration and notes
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', room_id)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin phòng' }, { status: 404 });
    }

    // Parse current bed config
    let bedConfig = 'SINGLE';
    if (room.notes) {
      if (room.notes.includes('|')) {
        bedConfig = room.notes.split('|')[0].trim();
      } else if (!room.notes.includes('DAMAGE:')) {
        bedConfig = room.notes.trim();
      }
    }

    // Auto-discover booking and customer
    let bookingId = booking_id;
    let customerId = null;

    if (!bookingId) {
      const { data: activeBooking } = await supabase
        .from('bookings')
        .select('id, user_id')
        .eq('room_id', room_id)
        .in('status', ['CONFIRMED', 'CHECKED_IN'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeBooking) {
        bookingId = activeBooking.id;
        customerId = activeBooking.user_id;
      }
    } else {
      const { data: booking } = await supabase
        .from('bookings')
        .select('user_id')
        .eq('id', bookingId)
        .maybeSingle();
      if (booking) {
        customerId = booking.user_id;
      }
    }

    // Build the damage details metadata
    const damageData = {
      description: description || 'Hư hại phòng',
      detailed_note: detailed_note || 'Báo cáo từ nhân viên buồng phòng',
      image: evidence_image || null,
      estimated_charge: estimated_charge || 0,
      approved_charge: 0,
      is_chargeable: true,
      booking_id: bookingId || null,
      customer_id: customerId || null,
      reported_by_user_id: user.sub
    };

    const newNotes = `${bedConfig} | DAMAGE: ${JSON.stringify(damageData)}`;

    // Update room notes and set room status to MAINTENANCE
    const { error: updateError } = await supabase
      .from('rooms')
      .update({
        notes: newNotes,
        status: 'MAINTENANCE',
        status_updated_at: new Date().toISOString()
      })
      .eq('id', room_id);

    if (updateError) {
      console.error("Failed to update room metadata for damage:", updateError);
      return NextResponse.json({ error: 'Lỗi server khi cập nhật trạng thái phòng' }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Báo hỏng và chuyển trạng thái phòng thành công', data: { id: `incident-${room_id}` } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Lỗi API POST /api/incidents:', error);
    return NextResponse.json({ error: error.message || 'Đã có lỗi bất ngờ xảy ra' }, { status: 500 });
  }
}