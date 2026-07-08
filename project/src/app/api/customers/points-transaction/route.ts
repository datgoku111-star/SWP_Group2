import { NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase';
import { PointsTransactionSchema } from '@/types/customer-loyalty';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate payload bằng Zod
    const validatedData = PointsTransactionSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Dữ liệu giao dịch không hợp lệ', details: validatedData.error.format() },
        { status: 400 }
      );
    }

    const { customer_id, booking_id, reward_item_id, transaction_type, points_changed, reason } = validatedData.data;

    // 2. Lấy thông tin ví điểm hiện tại của khách hàng để kiểm tra điều kiện
    const { data: customer, error: customerError } = await supabase
      .from('customer_profiles')
      .select('current_points, total_accumulated_points')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản khách hàng' }, { status: 404 });
    }

    // Tính toán số dư điểm mới dự kiến
    const nextPoints = customer.current_points + points_changed;

    // Kiểm tra xem khách có đủ điểm để tiêu không (Trường hợp trừ điểm đổi quà)
    if (nextPoints < 0) {
      return NextResponse.json({ error: 'Số dư điểm thưởng của khách hàng không đủ để thực hiện giao dịch này' }, { status: 400 });
    }

    // 3. Tính toán tổng điểm tích lũy trọn đời (chỉ cộng thêm khi loại giao dịch là EARNED)
    let nextAccumulatedPoints = customer.total_accumulated_points;
    if (transaction_type === 'EARNED' && points_changed > 0) {
      nextAccumulatedPoints += points_changed;
    }

    // 4. Tự động xét duyệt thăng hạng thành viên dựa trên tổng điểm tích lũy trọn đời
    let nextMembershipLevel = 'STANDARD';
    if (nextAccumulatedPoints >= 2000) {
      nextMembershipLevel = 'DIAMOND';
    } else if (nextAccumulatedPoints >= 1000) {
      nextMembershipLevel = 'GOLD';
    } else if (nextAccumulatedPoints >= 500) {
      nextMembershipLevel = 'SILVER';
    }

    // 5. Cập nhật số dư ví điểm và hạng thành viên của khách hàng
    const { error: updateError } = await supabase
      .from('customer_profiles')
      .update({
        current_points: nextPoints,
        total_accumulated_points: nextAccumulatedPoints,
        membership_level: nextMembershipLevel,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customer_id);

    if (updateError) {
      return NextResponse.json({ error: 'Cập nhật ví điểm thất bại' }, { status: 500 });
    }

    // 6. Ghi log lịch sử biến động điểm vào bảng loyalty_points_history
    const { error: historyError } = await supabase
      .from('loyalty_points_history')
      .insert({
        customer_id,
        booking_id: booking_id || null,
        reward_item_id: reward_item_id || null,
        transaction_type,
        points_changed,
        reason,
      });

    if (historyError) {
      console.error('Lỗi ghi log lịch sử điểm:', historyError);
      // Ghi chú: Thực tế nên áp dụng RPC transaction để rollback, ở đây viết tuần tự để bạn dễ hình dung mạch xử lý
      return NextResponse.json({ error: 'Giao dịch ví thành công nhưng không thể lưu nhật ký lịch sử' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Xử lý giao dịch điểm thưởng thành công',
      data: {
        current_points: nextPoints,
        membership_level: nextMembershipLevel
      }
    });

  } catch (error) {
    console.error('Lỗi API Points Transaction:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống xử lý giao dịch' }, { status: 500 });
  }
}