"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Route } from "@/routers/types";
import ButtonPrimary from "@/shared/ButtonPrimary";
import type { InvoiceData } from "@/types/hotel";
import { Dialog, Transition } from "@headlessui/react";
import ButtonSecondary from "@/shared/ButtonSecondary";
import { Printer, CreditCard, XCircle, AlertTriangle } from "lucide-react";

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"CARD" | "CASH" | "BANK_TRANSFER">("CARD");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isRequestingCheckout, setIsRequestingCheckout] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/hsrm-login?callbackUrl=/bookings/${params.id}` as Route);
    } else if (user) {
      fetchInvoice();
    }
  }, [user, isLoading, router, params.id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/bookings/${params.id}/invoice`);
      if (!res.ok) throw new Error("Failed to fetch invoice");
      const data = await res.json();
      setInvoice(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!invoice) return;
    setCheckoutLoading(true);
    setError("");
    
    try {
      const res = await fetch(`/api/checkin/${params.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: selectedPaymentMethod,
          amount: invoice.balance_due,
          transaction_ref: "TXN-" + Math.random().toString(36).substring(7).toUpperCase()
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Checkout failed");
      }

      setSuccess("Checkout completed successfully! Thank you for staying with us.");
      fetchInvoice(); // Refresh data
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (isStaff && !cancelReason.trim()) {
      alert("Vui lòng nhập lý do hủy phòng.");
      return;
    }

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${params.id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason })
      });
      if (res.ok) {
        setCancelModalOpen(false);
        setSuccess("Đã hủy đặt phòng thành công.");
        fetchInvoice(); // Refresh data
      } else {
        const err = await res.json();
        setError(err.error || "Failed to cancel booking.");
      }
    } catch (err: any) {
      console.error("Cancel error:", err);
      setError("An error occurred while cancelling the booking.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmBooking = async () => {
    setIsConfirming(true);
    try {
      const res = await fetch(`/api/bookings/${params.id}/confirm`, {
        method: "POST",
      });
      if (res.ok) {
        setSuccess("Đã xác nhận phòng thành công.");
        fetchInvoice(); // Refresh data
      } else {
        const err = await res.json();
        setError(err.error || "Failed to confirm booking.");
      }
    } catch (err: any) {
      console.error("Confirm error:", err);
      setError("An error occurred while confirming.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRequestCheckout = async () => {
    setIsRequestingCheckout(true);
    try {
      const res = await fetch(`/api/bookings/${params.id}/request-checkout`, {
        method: "POST",
      });
      if (res.ok) {
        setSuccess("Đã gửi yêu cầu trả phòng (checkout) đến Lễ tân.");
        fetchInvoice(); // Refresh data
      } else {
        const err = await res.json();
        setError(err.error || "Failed to request checkout.");
      }
    } catch (err: any) {
      console.error("Request checkout error:", err);
      setError("An error occurred while requesting checkout.");
    } finally {
      setIsRequestingCheckout(false);
    }
  };

  if (isLoading || loading) return <div className="container py-20">Loading...</div>;
  if (!invoice) return <div className="container py-20">Invoice not found or error occurred.</div>;

  const b = invoice.booking;
  const isStaff = ["ADMIN", "RECEPTIONIST"].includes(user?.role || "");
  const canCheckout = isStaff && b.status === "CHECKED_IN";
  const canConfirm = isStaff && b.status === "PENDING";
  const canCancel = (b.status === "PENDING" || (!isStaff && b.status === "CONFIRMED"));
  
  const canRequestCheckout = !isStaff && b.status === "CHECKED_IN" && (!b.checkout_step || b.checkout_step === "NONE");
  
  let cancelReasonText = null;
  if (b.special_requests) {
    const match = b.special_requests.match(/\[CANCEL_REASON:\s*(.*?)\]/);
    if (match && match[1]) {
      cancelReasonText = match[1];
    }
  }

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  return (
    <div className="container py-16 mb-24 lg:mb-32">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center gap-3">
          <h2 className="text-3xl font-semibold sm:text-4xl">Booking Details</h2>
          <div className="flex gap-3">
            {canConfirm && (
              <button 
                onClick={handleConfirmBooking}
                disabled={isConfirming}
                className="flex items-center text-white font-medium bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isConfirming ? "Confirming..." : "Confirm Booking"}
              </button>
            )}
            {canCancel && (
              <button 
                onClick={() => setCancelModalOpen(true)}
                className="flex items-center text-red-600 hover:text-red-700 font-medium bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 mr-2" /> Cancel Booking
              </button>
            )}
            {canRequestCheckout && (
              <button 
                onClick={handleRequestCheckout}
                disabled={isRequestingCheckout}
                className="flex items-center text-white font-medium bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isRequestingCheckout ? "Sending..." : "Request Checkout"}
              </button>
            )}
            <button className="flex items-center text-primary-6000 hover:text-primary-700 font-medium bg-primary-50 px-4 py-2 rounded-lg" onClick={() => window.print()}>
              <Printer className="w-5 h-5 mr-2" /> Print Invoice
            </button>
          </div>
        </div>

        {error && <div className="p-4 bg-red-100 text-red-800 rounded-xl">{error}</div>}
        {success && <div className="p-4 bg-green-100 text-green-800 rounded-xl">{success}</div>}

        {isStaff && invoice.incident_charges && invoice.incident_charges.incidents.length > 0 && (
          <div className="p-6 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800/60 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-extrabold text-red-800 dark:text-red-400 text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Phê Duyệt Đền Bù Sự Cố / Thiệt Hại Phòng
            </h3>
            <p className="text-xs text-neutral-500">
              Nhân viên buồng phòng đã báo cáo thiệt hại. Bạn hãy kiểm tra ảnh hiện trường, điều chỉnh số tiền đền bù thực tế (nếu cần) rồi xác nhận để cộng vào tổng tiền thanh toán check-out.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invoice.incident_charges.incidents.map((incident: any) => {
                const estimatedUSD = Math.round(Number(incident.estimated_charge) / 26320);
                const approvedUSD = incident.approved_charge ? Math.round(Number(incident.approved_charge) / 26320) : estimatedUSD;
                
                return (
                  <div key={incident.id} className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-red-150 dark:border-red-800/40 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Mã: {incident.incident_code}
                        </span>
                        <span className="text-xs font-semibold text-neutral-500 uppercase">
                          {incident.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-neutral-900 dark:text-white mt-1">
                        Sự cố: {incident.description}
                      </h4>
                      {incident.detailed_note && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 italic">
                          " {incident.detailed_note} "
                        </p>
                      )}

                      {incident.incident_evidence && incident.incident_evidence.length > 0 && (
                        <div className="mt-2.5">
                          <p className="text-[10px] font-bold text-neutral-400 mb-1">Ảnh hiện trường:</p>
                          <img
                            src={incident.incident_evidence[0].file_url}
                            alt="Evidence photo"
                            className="w-full max-h-32 object-cover rounded-xl border border-neutral-100 dark:border-neutral-800"
                          />
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                      <div className="flex justify-between items-center text-xs text-neutral-500">
                        <span>Ước tính đền bù:</span>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {formatMoney(incident.estimated_charge)} (${estimatedUSD})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 justify-between">
                        <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                          Tiền đền bù duyệt:
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-neutral-400">$</span>
                          <input
                            type="number"
                            defaultValue={approvedUSD}
                            id={`app-charge-${incident.id}`}
                            className="w-20 text-xs text-right bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 text-neutral-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          const inputEl = document.getElementById(`app-charge-${incident.id}`) as HTMLInputElement;
                          const chargeUSD = Number(inputEl?.value || 0);
                          if (isNaN(chargeUSD) || chargeUSD < 0) {
                            alert("Vui lòng nhập số tiền đền bù hợp lệ.");
                            return;
                          }

                          try {
                            const res = await fetch(`/api/incidents/${incident.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                approved_charge: chargeUSD,
                                status: 'APPROVED_CHARGE',
                                note: `Lễ tân xác nhận số tiền đền bù thiệt hại phòng là $${chargeUSD}`
                              })
                            });
                            if (res.ok) {
                              setSuccess("Đã cập nhật tiền đền bù sự cố!");
                              fetchInvoice();
                            } else {
                              const err = await res.json();
                              setError(err.error || "Failed to update charge.");
                            }
                          } catch (e: any) {
                            setError(e.message);
                          }
                        }}
                        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow"
                      >
                        Duyệt số tiền này
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isStaff && b.checkout_step && b.checkout_step !== "NONE" && (
          <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
            <h3 className="font-bold text-amber-800 dark:text-amber-400 mb-2">Checkout Request Status:</h3>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                b.checkout_step === "REQUESTED" ? "bg-amber-200 text-amber-900" :
                b.checkout_step === "INSPECTING" ? "bg-blue-200 text-blue-900" :
                "bg-green-200 text-green-900"
              }`}>
                {b.checkout_step === "REQUESTED" ? "Waiting for Receptionist" :
                 b.checkout_step === "INSPECTING" ? "Inspecting Room" :
                 "Inspection Complete"}
              </span>
            </div>
            {b.checkout_message && (
              <p className="text-sm text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 p-3 rounded-lg mt-3">
                <span className="font-bold">Receptionist:</span> {b.checkout_message}
              </p>
            )}
            {b.checkout_step === "INSPECTED" && (
              <p className="text-sm font-medium mt-3 text-green-700 dark:text-green-400">
                Room inspection is complete. Please go to the reception desk to finalize your payment.
              </p>
            )}
          </div>
        )}

        {/* Invoice Paper */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-3xl shadow-lg p-8 sm:p-12 print:shadow-none print:border-none print:p-0">
          
          <div className="flex justify-between items-start border-b border-neutral-200 dark:border-neutral-700 pb-8 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-primary-6000 mb-1">HotelOS</h1>
              <p className="text-neutral-500 text-sm">123 Hospitality Ave, Tech City</p>
              <p className="text-neutral-500 text-sm">contact@hotelos.com</p>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-bold mb-1">INVOICE</h3>
              <p className="text-neutral-500 text-sm">#INV-{b.id.split('-')[0].toUpperCase()}</p>
              <p className="text-neutral-500 text-sm">Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">Billed To:</h4>
              <p className="font-medium">{b.guest?.full_name || b.user?.full_name}</p>
              <p className="text-neutral-500 text-sm">{b.guest?.email || b.user?.email}</p>
              {b.guest?.phone && <p className="text-neutral-500 text-sm">{b.guest.phone}</p>}
            </div>
            <div className="text-right">
              <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">Stay Details:</h4>
              <p className="font-medium">Room {b.room?.room_number} ({b.room?.room_type?.name})</p>
              <p className="text-neutral-500 text-sm">{b.check_in_date} — {b.check_out_date}</p>
              <p className="text-neutral-500 text-sm">Status: <span className="font-semibold">{b.status}</span></p>
              {b.status === "CANCELLED" && cancelReasonText && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1 font-medium italic break-words">
                    Lý do hủy: {cancelReasonText}
                  </p>
                )}
            </div>
          </div>

          <table className="w-full text-left mb-8">
            <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {/* Room Charge */}
              <tr>
                <td className="py-4 px-4">
                  <div className="font-medium">Room Charge</div>
                  <div className="text-sm text-neutral-500">{b.room?.room_type?.base_price} VND x {Math.ceil((new Date(b.check_out_date).getTime() - new Date(b.check_in_date).getTime()) / (1000*60*60*24))} nights</div>
                </td>
                <td className="py-4 px-4 text-right font-medium">{formatMoney(invoice.room_charges)}</td>
              </tr>
              
              {/* Services */}
              {invoice.service_charges.map((order, i) => (
                <React.Fragment key={i}>
                  {order.items.map((item, j) => (
                    <tr key={`${i}-${j}`}>
                      <td className="py-4 px-4">
                        <div className="font-medium">{item.service?.name}</div>
                        <div className="text-sm text-neutral-500">{item.quantity} x {formatMoney(item.unit_price)}</div>
                      </td>
                      <td className="py-4 px-4 text-right font-medium">{formatMoney(item.subtotal)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {/* Incident Charges */}
              {invoice.incident_charges && invoice.incident_charges.incidents.length > 0 && (
                <React.Fragment>
                  {invoice.incident_charges.incidents.map((incident, i) => (
                    <tr key={`incident-${i}`} className="text-red-600 dark:text-red-400">
                      <td className="py-4 px-4">
                        <div className="font-medium">Sự cố / Phạt đền: {incident.description}</div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">Mã: {incident.incident_code} | Trạng thái: {incident.status}</div>
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        {formatMoney(Number(incident.approved_charge || incident.estimated_charge || 0))}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              )}

              {/* Auxiliary Charges: Experiences */}
              {invoice.experience_charges && invoice.experience_charges.map((exp, i) => (
                <tr key={`exp-${i}`} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-4 px-4">
                    <div className="font-medium">Experience / Tour Booking</div>
                    <div className="text-sm text-neutral-500">{exp.guests} Guests</div>
                  </td>
                  <td className="py-4 px-4 text-right font-medium">{formatMoney(exp.total)}</td>
                </tr>
              ))}

              {/* Auxiliary Charges: Cars */}
              {invoice.car_charges && invoice.car_charges.map((car, i) => (
                <tr key={`car-${i}`} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-4 px-4">
                    <div className="font-medium">Car Rental</div>
                    <div className="text-sm text-neutral-500">{car.car_type}</div>
                  </td>
                  <td className="py-4 px-4 text-right font-medium">{formatMoney(car.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end border-t border-neutral-200 dark:border-neutral-700 pt-8">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Subtotal</span>
                <span>{formatMoney(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>VAT ({(invoice.vat_rate * 100).toFixed(0)}%)</span>
                <span>{formatMoney(invoice.vat_amount)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t border-neutral-200 dark:border-neutral-700 pt-3">
                <span>Grand Total</span>
                <span>{formatMoney(invoice.grand_total)}</span>
              </div>
              
              {invoice.payments.length > 0 && (
                <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="text-sm font-semibold mb-2">Payments Received:</div>
                  {invoice.payments.map(p => (
                    <div key={p.id} className="flex justify-between text-sm text-green-600">
                      <span>{new Date(p.created_at).toLocaleDateString()} ({p.method})</span>
                      <span>-{formatMoney(p.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-lg font-bold text-red-600 mt-2 border-t border-neutral-200 dark:border-neutral-700 pt-2">
                    <span>Balance Due</span>
                    <span>{formatMoney(invoice.balance_due)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Checkout Action (Staff Only) */}
        {canCheckout && (
          <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 sm:p-8 rounded-3xl space-y-6 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
              <div>
                <h3 className="font-extrabold text-xl text-neutral-900 dark:text-white">Front Desk Payment Settlement & Checkout</h3>
                <p className="text-neutral-500 text-sm mt-0.5">Select guest payment method and confirm check-out to release room to housekeeping.</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-400 block uppercase font-bold">Balance Due</span>
                <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{formatMoney(invoice.balance_due)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Choose Payment Method</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["CARD", "CASH", "BANK_TRANSFER"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(method)}
                    className={`py-3 px-4 rounded-2xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedPaymentMethod === method
                        ? "border-amber-600 bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 ring-2 ring-amber-500/30"
                        : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <span>{method === "CARD" ? "💳 POS / Credit Card" : method === "CASH" ? "💵 Cash at Counter" : "🏦 Bank Transfer / QR"}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <ButtonPrimary
                onClick={handleCheckout}
                loading={checkoutLoading}
                disabled={checkoutLoading || invoice.balance_due < 0}
                className="w-full sm:w-auto px-8 h-12 text-base font-bold bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/25"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                <span>Confirm Check-Out ({selectedPaymentMethod})</span>
              </ButtonPrimary>
            </div>
          </div>
        )}
      </div>

      {/* CANCEL MODAL */}
      <Transition appear show={cancelModalOpen} as={React.Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={() => !isCancelling && setCancelModalOpen(false)}>
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-40" />
            </Transition.Child>

            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-neutral-900 shadow-xl rounded-2xl">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Xác nhận hủy đặt phòng
                </Dialog.Title>
                <div className="mt-2 text-sm text-gray-500 dark:text-neutral-400">
                  Bạn có chắc chắn muốn hủy đặt phòng{" "}
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {b?.id.split("-")[0].toUpperCase()}
                  </span>
                  ?
                  {isStaff ? (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl font-medium text-left">
                      Lưu ý: Tiền cọc sẽ được hoàn trả lại cho khách hàng.
                      <textarea
                        className="w-full mt-3 p-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-neutral-900 text-sm font-normal text-neutral-700 dark:text-neutral-300"
                        placeholder="Nhập lý do hủy phòng..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl font-medium">
                      Lưu ý: Hủy phòng sẽ làm bạn mất khoản tiền cọc là 10% tổng giá trị ban đầu (
                      <span className="font-bold">{formatMoney((b?.total_amount || invoice?.grand_total || 0) * 0.1)}</span>
                      ). Hành động này không thể hoàn tác.
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <ButtonSecondary onClick={() => setCancelModalOpen(false)} disabled={isCancelling}>
                    Không, giữ lại
                  </ButtonSecondary>
                  <ButtonPrimary onClick={handleCancelBooking} loading={isCancelling} className="bg-red-600 hover:bg-red-700">
                    Đồng ý hủy
                  </ButtonPrimary>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
