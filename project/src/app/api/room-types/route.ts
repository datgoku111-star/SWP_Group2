import { NextResponse } from "next/server";
import { getRoomTypes } from "@/lib/db/rooms";
import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  try {
    const types = await getRoomTypes();
    return NextResponse.json(types);
  } catch (error) {
    console.error("GET room-types error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, base_price, max_occupancy, amenities, images } = body;

    if (!name || base_price === undefined) {
      return NextResponse.json({ error: "Thiếu tên hạng phòng hoặc đơn giá cơ bản" }, { status: 400 });
    }

    const { data: newType, error } = await supabaseServer
      .from("room_types")
      .insert({
        name,
        description: description || "",
        base_price: Number(base_price),
        max_occupancy: max_occupancy ? Number(max_occupancy) : 2,
        amenities: amenities || ["Wifi", "Smart TV", "Air Conditioning"],
        images: images || ["/images/rooms/deluxe-1.jpg"],
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ message: "Tạo hạng phòng thành công", room_type: newType });
  } catch (error: any) {
    console.error("POST room-types error:", error);
    return NextResponse.json({ error: error.message || "Failed to create room type" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, base_price, max_occupancy, amenities, images } = body;

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID hạng phòng" }, { status: 400 });
    }

    const { data: updatedType, error } = await supabaseServer
      .from("room_types")
      .update({
        name,
        description,
        base_price: base_price !== undefined ? Number(base_price) : undefined,
        max_occupancy: max_occupancy !== undefined ? Number(max_occupancy) : undefined,
        amenities,
        images,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ message: "Cập nhật hạng phòng thành công", room_type: updatedType });
  } catch (error: any) {
    console.error("PUT room-types error:", error);
    return NextResponse.json({ error: error.message || "Failed to update room type" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID hạng phòng cần xóa" }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from("room_types")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ message: "Xóa hạng phòng thành công" });
  } catch (error: any) {
    console.error("DELETE room-types error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete room type" }, { status: 500 });
  }
}
