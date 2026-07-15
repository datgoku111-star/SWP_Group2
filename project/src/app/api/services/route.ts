import { NextResponse } from "next/server";
import { getAllServices, getServices, createService, updateService, deleteService } from "@/lib/db/services";
import type { ServiceCategory } from "@/types/hotel";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const all = searchParams.get("all") === "true";

    let services;
    if (all) {
      services = await getAllServices();
    } else {
      services = await getServices(category);
    }

    return NextResponse.json(services);
  } catch (error) {
    console.error("GET services error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, price, description, is_available, image_url } = body;

    if (!name || !category || price === undefined) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc (name, category, price)" }, { status: 400 });
    }

    const newService = await createService({
      name,
      category: category as ServiceCategory,
      price: Number(price),
      description,
      is_available,
      image_url,
    });

    return NextResponse.json({ message: "Tạo dịch vụ thành công", service: newService });
  } catch (error: any) {
    console.error("POST services error:", error);
    return NextResponse.json({ error: error.message || "Failed to create service" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, category, price, description, is_available, image_url } = body;

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID dịch vụ cần cập nhật" }, { status: 400 });
    }

    const updatedService = await updateService(id, {
      name,
      category: category as ServiceCategory,
      price: price !== undefined ? Number(price) : undefined,
      description,
      is_available,
      image_url,
    });

    return NextResponse.json({ message: "Cập nhật dịch vụ thành công", service: updatedService });
  } catch (error: any) {
    console.error("PUT services error:", error);
    return NextResponse.json({ error: error.message || "Failed to update service" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  return PUT(request);
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID dịch vụ cần xóa" }, { status: 400 });
    }

    await deleteService(id);
    return NextResponse.json({ message: "Xóa dịch vụ thành công" });
  } catch (error: any) {
    console.error("DELETE services error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete service" }, { status: 500 });
  }
}
