import { NextResponse } from 'next/server';
import { CreateLostFoundSchema } from '@/types/lost-found';
import { LOST_FOUND_STATUS } from '@/contains/incident';
import { supabaseServer as supabase } from '@/lib/supabase';

// Hàm tự sinh mã đồ thất lạc
function generateItemCode(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LF-${yyyy}${mm}${dd}-${randomStr}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate payload
    const validatedData = CreateLostFoundSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: validatedData.error.format() },
        { status: 400 }
      );
    }

    // TODO: Lấy User ID từ session khi tích hợp Auth thực tế
    const currentUserId = '00000000-0000-0000-0000-000000000000'; 

    const { data: newItem, error } = await supabase
      .from('lost_found_items')
      .insert({
        item_code: generateItemCode(),
        ...validatedData.data,
        status: LOST_FOUND_STATUS.FOUND, // Mặc định là FOUND khi mới tạo
        found_by_user_id: currentUserId,
      })
      .select('id, item_code')
      .single();

    if (error || !newItem) {
      console.error('Lỗi Database:', error);
      return NextResponse.json({ error: 'Không thể lưu dữ liệu đồ thất lạc' }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Đã ghi nhận đồ thất lạc', data: newItem },
      { status: 201 }
    );
  } catch (error) {
    console.error('Lỗi API POST /api/lost-found:', error);
    return NextResponse.json({ error: 'Đã có lỗi bất ngờ xảy ra' }, { status: 500 });
  }
}