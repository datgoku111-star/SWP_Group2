import { redirect } from "next/navigation";

export default function HousekeepingDashboard() {
  // Housekeeping staff primarily use the housekeeping grid
  redirect("/housekeeping");
}
