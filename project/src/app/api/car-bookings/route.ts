import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

// GET /api/car-bookings
// Returns all car rental service orders
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("booking_id");

    // Fetch all service orders
    let query = supabaseServer
      .from("service_orders")
      .select("*, booking:bookings(*, user:users(*), room:rooms(*, room_type:room_types(*)), guest:guests(*))");

    if (bookingId) {
      query = query.eq("booking_id", bookingId);
    }

    const { data: orders, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;

    // Filter only those representing car rentals (notes contain JSON with is_car_rental = true)
    const carBookings = (orders || [])
      .filter((order: any) => {
        try {
          if (!order.notes) return false;
          const notesObj = JSON.parse(order.notes);
          return notesObj.is_car_rental === true;
        } catch (e) {
          return false;
        }
      })
      .map((order: any) => {
        try {
          const notesObj = JSON.parse(order.notes || "{}");
          return {
            id: order.id,
            booking_id: order.booking_id,
            status: order.status, // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
            total_amount: order.total_amount,
            created_at: order.created_at,
            updated_at: order.updated_at,
            booking: order.booking,
            car_type: notesObj.car_type,
            pickup_date: notesObj.pickup_date,
            dropoff_date: notesObj.dropoff_date,
            gplx_image: notesObj.gplx_image,
            gplx_cccd: notesObj.gplx_cccd,
            status_text: notesObj.status_text, // Custom status: pending, rejected, Wait for the vehicle in the lobby., waiting to return the vehicle, return requested, returned
          };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);

    // If customer, filter to only their own bookings
    if (user.role === "CUSTOMER") {
      const filtered = carBookings.filter((cb: any) => cb.booking?.user_id === user.sub);
      return NextResponse.json(filtered);
    }

    return NextResponse.json(carBookings);
  } catch (error: any) {
    console.error("GET car bookings error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// POST /api/car-bookings
// Creates a new car rental service order (initial state: pending)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { booking_id, car_type, pickup_date, dropoff_date, total_price, gplx_image, gplx_cccd } = data;

    if (!booking_id || !car_type || !pickup_date || !dropoff_date || !gplx_cccd) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Build the notes metadata JSON
    const notes = JSON.stringify({
      is_car_rental: true,
      car_type,
      pickup_date,
      dropoff_date,
      gplx_image: gplx_image || "gplx_placeholder.png",
      gplx_cccd,
      status_text: "pending",
    });

    const { data: order, error } = await supabaseServer
      .from("service_orders")
      .insert({
        booking_id,
        status: "PENDING",
        total_amount: total_price || 0,
        notes,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error("POST car booking error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/car-bookings
// Updates the status of a car rental booking
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
    }

    const data = await request.json();
    const { status, status_text } = data; // status is order_status ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')

    // Fetch existing order first
    const { data: order, error: fetchError } = await supabaseServer
      .from("service_orders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Car booking not found" }, { status: 404 });
    }

    let notesObj = {};
    try {
      notesObj = JSON.parse(order.notes || "{}");
    } catch (e) {}

    // Update the custom status text and other details in notes
    const updatedNotes = JSON.stringify({
      ...notesObj,
      status_text: status_text || (notesObj as any).status_text || status,
    });

    const { data: updatedOrder, error: updateError } = await supabaseServer
      .from("service_orders")
      .update({
        status: status || order.status,
        notes: updatedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;
    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error("PATCH car booking error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
