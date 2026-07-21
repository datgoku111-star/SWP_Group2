import { supabaseServer } from "@/lib/supabase";
import type { Service, ServiceOrder, OrderStatus, ServiceCategory } from "@/types/hotel";

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

export async function createService(service: {
  name: string;
  category: ServiceCategory;
  price: number;
  description?: string;
  is_available?: boolean;
  image_url?: string;
}) {
  const { data, error } = await supabaseServer
    .from("services")
    .insert({
      name: service.name,
      category: service.category,
      price: service.price,
      description: service.description || "",
      is_available: service.is_available ?? true,
      image_url: service.image_url || "",
    })
    .select()
    .single();
  if (error) throw error;
  return data as Service;
}

export async function updateService(
  id: string,
  updates: Partial<{
    name: string;
    category: ServiceCategory;
    price: number;
    description: string;
    is_available: boolean;
    image_url: string;
  }>
) {
  const { data, error } = await supabaseServer
    .from("services")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Service;
}

export async function deleteService(id: string) {
  const { error } = await supabaseServer
    .from("services")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
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

export async function getPendingOrders(statuses?: string[]) {
  const filterStatuses = statuses && statuses.length > 0 ? statuses : ["PENDING", "IN_PROGRESS"];
  const { data, error } = await supabaseServer
    .from("service_orders")
    .select("*, items:service_order_items(*, service:services(*)), booking:bookings(*, room:rooms(room_number))")
    .in("status", filterStatuses)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ServiceOrder[];
}

export async function updateOrderStatus(id: string, status: OrderStatus, notes?: string) {
  const updatePayload: any = { status, updated_at: new Date().toISOString() };
  if (notes !== undefined && notes !== null) {
    updatePayload.notes = notes;
  }
  try {
    const { data, error } = await supabaseServer
      .from("service_orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.warn("Supabase updateOrderStatus notice:", error.message);
      return { id, status, notes, updated_at: new Date().toISOString() } as ServiceOrder;
    }
    return data as ServiceOrder;
  } catch (err) {
    console.warn("updateOrderStatus exception:", err);
    return { id, status, notes, updated_at: new Date().toISOString() } as ServiceOrder;
  }
}
