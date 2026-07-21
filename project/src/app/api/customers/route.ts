import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { CustomerProfileSchema } from '@/types/customer-loyalty';

// API Lấy danh sách khách hàng (Có sắp xếp theo ngày tạo mới nhất)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('customer_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Không thể lấy danh sách khách hàng' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi máy chủ bất ngờ' }, { status: 500 });
  }
}

// API Tạo hồ sơ tài khoản khách hàng mới
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate dữ liệu đầu vào bằng Zod Schema đã tạo ở Phase 2
    const validatedData = CustomerProfileSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: validatedData.error.format() },
        { status: 400 }
      );
    }

    // Tiến hành lưu vào bảng customer_profiles
    const { data: newCustomer, error } = await supabase
      .from('customer_profiles')
      .insert({
        full_name: validatedData.data.full_name,
        email: validatedData.data.email || null,
        phone: validatedData.data.phone || null,
        preferences_notes: validatedData.data.preferences_notes || null,
        membership_level: 'STANDARD', // Mặc định là hạng Standard khi tạo mới
        current_points: 0,
        total_accumulated_points: 0,
        total_spent: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Lỗi Database:', error);
      return NextResponse.json({ error: 'Không thể tạo hồ sơ khách hàng' }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Tạo tài khoản khách hàng thành công', data: newCustomer },
      { status: 201 }
    );
  } catch (error) {
    console.error('Lỗi hệ thống API:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi hệ thống' }, { status: 500 });
  }
}
