import { redirect } from "next/navigation";

export default function KitchenDashboard() {
  // Kitchen staff primarily use the orders queue
  redirect("/orders");
}
