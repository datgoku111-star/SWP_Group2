import sys

file_path = 'project/src/components/ReceptionistServiceHub.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update activeSubTab
content = content.replace(
    'useState<"ROOMS" | "ORDERS" | "CAR_RENTALS" | "EXPERIENCES">("ROOMS");',
    'useState<"ROOMS" | "ORDERS" | "CAR_RENTALS" | "EXPERIENCES" | "CHECKOUTS">("ROOMS");'
)

# 2. Add checkout tab button
button_target = '<button onClick={fetchAllData} className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors" title="Làm mới">'
button_replacement = '''<button
            onClick={() => setActiveSubTab("CHECKOUTS")}
            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeSubTab === "CHECKOUTS"
                ? "bg-white text-primary-700 shadow-lg scale-105"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Checkout Requests
          </button>
          <button onClick={fetchAllData} className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors" title="Làm mới">'''
content = content.replace(button_target, button_replacement)

# 3. Add handlers
handler_target = 'const handleCancelOrder = async (orderId: string) => {'
handler_replacement = '''const handleCheckoutAction = async (bookingId: string, action: string) => {
    try {
      const res = await fetch("/api/receptionist/checkout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action })
      });
      if (res.ok) {
        alert("Housekeeping notified successfully!");
        fetchAllData();
      } else {
        alert("Failed to notify housekeeping.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
  };

  const handleCompleteCheckout = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CHECKED_OUT" })
      });
      alert("Checkout complete!");
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelOrder = async (orderId: string) => {'''
content = content.replace(handler_target, handler_replacement)

# 4. Add CHECKOUTS tab content
tab_content_target = '{/* MODAL ORDER ROOM SERVICE / F&B FOR GUEST */}'
tab_content_replacement = '''{/* SUB-TAB 5: CHECKOUT REQUESTS */}
      {activeSubTab === "CHECKOUTS" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700 pb-4">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-primary-600" />
              Checkout Requests
            </h3>
          </div>
          <div className="space-y-4">
            {bookings.filter(b => b.checkout_step && b.checkout_step !== "NONE" && b.status === "CHECKED_IN").length === 0 && (
              <p className="text-neutral-500 py-8 text-center bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700">No checkout requests at the moment.</p>
            )}
            {bookings.filter(b => b.checkout_step && b.checkout_step !== "NONE" && b.status === "CHECKED_IN").map(b => (
              <div key={b.id} className="p-4 bg-white dark:bg-neutral-800 border rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div>
                  <h4 className="font-bold text-lg">Room {b.room?.room_number}</h4>
                  <p className="text-sm text-neutral-500">Guest: {b.user?.full_name || b.guest?.full_name}</p>
                  <p className="text-sm font-semibold mt-1 text-primary-600">Status: {b.checkout_step}</p>
                  {b.checkout_message && <p className="text-sm mt-1">Message: {b.checkout_message}</p>}
                </div>
                <div className="flex gap-2">
                  {b.checkout_step === "REQUESTED" && (
                    <button onClick={() => handleCheckoutAction(b.id, "SEND_CLEANER")} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                      Send Housekeeping
                    </button>
                  )}
                  {b.checkout_step === "INSPECTED" && (
                    <button onClick={() => handleCompleteCheckout(b.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
                      Complete Checkout
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL ORDER ROOM SERVICE / F&B FOR GUEST */}'''
content = content.replace(tab_content_target, tab_content_replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
