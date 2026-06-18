import { supabaseServer } from "@/lib/supabase";
import type { Service, ServiceOrder, OrderStatus } from "@/types/hotel";

export async function getServices(category?: string) {
  let query = supabaseServer
    .from("services")
    .select("*")
    .eq("is_available", true);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query.order("category").order("name");
  if (error) throw error;
  return data as Service[];
}

export async function getAllServices() {
  const { data, error } = await supabaseServer
    .from("services")
    .select("*")
    .order("category")
    .order("name");
  if (error) throw error;
  return data as Service[];
}

export async function createServiceOrder(order: {
  booking_id: string;
  items: { service_id: string; quantity: number }[];
  notes?: string;
}) {
  // Fetch service prices
  const serviceIds = order.items.map((i) => i.service_id);
  const { data: services } = await supabaseServer
    .from("services")
    .select("id, price")
    .in("id", serviceIds);

  if (!services) throw new Error("Failed to fetch service prices");

  const priceMap = new Map(services.map((s) => [s.id, s.price]));
  let totalAmount = 0;
  const itemsWithPrices = order.items.map((item) => {
    const unitPrice = priceMap.get(item.service_id) || 0;
    const subtotal = unitPrice * item.quantity;
    totalAmount += subtotal;
    return { ...item, unit_price: unitPrice, subtotal };
  });

  // Create order
  const { data: orderData, error: orderError } = await supabaseServer
    .from("service_orders")
    .insert({
      booking_id: order.booking_id,
      status: "PENDING" as OrderStatus,
      total_amount: totalAmount,
      notes: order.notes,
    })
    .select()
    .single();
  if (orderError) throw orderError;

  // Create order items
  const orderItems = itemsWithPrices.map((item) => ({
    order_id: orderData.id,
    service_id: item.service_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.subtotal,
  }));

  const { error: itemsError } = await supabaseServer
    .from("service_order_items")
    .insert(orderItems);
  if (itemsError) throw itemsError;

  return { ...orderData, items: orderItems } as ServiceOrder;
}

export async function getOrdersByBooking(bookingId: string) {
  const { data, error } = await supabaseServer
    .from("service_orders")
    .select("*, items:service_order_items(*, service:services(*))")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ServiceOrder[];
}

export async function getPendingOrders() {
  const { data, error } = await supabaseServer
    .from("service_orders")
    .select("*, items:service_order_items(*, service:services(*)), booking:bookings(*, room:rooms(room_number))")
    .in("status", ["PENDING", "IN_PROGRESS"])
    .order("created_at");
  if (error) throw error;
  return data as ServiceOrder[];
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { data, error } = await supabaseServer
    .from("service_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ServiceOrder;
}
