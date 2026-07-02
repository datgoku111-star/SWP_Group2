import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';

export async function GET() {
  // Lấy tổng số sự cố theo loại (Incident Type)
  const { data, error } = await supabase
    .from('room_incidents')
    .select('incident_type, id');

  if (error) return NextResponse.json({ error: 'Lỗi lấy báo cáo' }, { status: 500 });

  // Gom nhóm dữ liệu
  const stats = data.reduce((acc: any, item) => {
    acc[item.incident_type] = (acc[item.incident_type] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json(stats);
}