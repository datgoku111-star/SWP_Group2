import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";

export default async function DashboardRedirect() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/hsrm-login");
  }

  // Redirect to role-specific dashboard
  switch (user.role) {
    case "ADMIN":
      redirect("/dashboard/admin");
    case "RECEPTIONIST":
      redirect("/dashboard/receptionist");
    case "HOUSEKEEPING":
      redirect("/dashboard/housekeeping");
    case "KITCHEN":
      redirect("/dashboard/kitchen");
    case "CUSTOMER":
      redirect("/dashboard/customer");
    default:
      redirect("/");
  }
}
