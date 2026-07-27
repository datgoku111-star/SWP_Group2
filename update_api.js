const fs = require('fs');

let filepath = 'project/src/app/api/receptionist/checkout-request/route.ts';
let content = fs.readFileSync(filepath, 'utf8');

const oldAction = `    if (action === "SEND_CLEANER") {
      const { error } = await supabaseServer
        .from("bookings")
        .update({
          checkout_step: "INSPECTING",
          checkout_message: message || "A cleaner is inspecting your room for checkout.",
        })
        .eq("id", bookingId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }`;

const newAction = `    if (action === "SEND_CLEANER") {
      const { error } = await supabaseServer
        .from("bookings")
        .update({
          checkout_step: "INSPECTING",
          checkout_message: message || "A cleaner is inspecting your room for checkout.",
        })
        .eq("id", bookingId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === "REQUEST_OVERDUE") {
      const { error } = await supabaseServer
        .from("bookings")
        .update({
          checkout_step: "OVERDUE_REQUESTED",
          checkout_message: message || "Phòng của bạn đã quá hạn trả phòng. Vui lòng làm thủ tục checkout ngay. Lý do: Quá hạn.",
        })
        .eq("id", bookingId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }`;

if (content.includes('action === "SEND_CLEANER"')) {
    content = content.replace(oldAction, newAction);
    fs.writeFileSync(filepath, content, 'utf8');
    console.log("Updated API route successfully.");
} else {
    console.log("Could not find insertion point.");
}
