"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Route } from "@/routers/types";
import ButtonPrimary from "@/shared/ButtonPrimary";
import type { InvoiceData } from "@/types/hotel";
import { Printer, CreditCard } from "lucide-react";

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
          payment_method: "CARD", // Hardcoded for demo
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

  if (isLoading || loading) return <div className="container py-20">Loading...</div>;
  if (!invoice) return <div className="container py-20">Invoice not found or error occurred.</div>;

  const b = invoice.booking;
  const canCheckout = ["ADMIN", "RECEPTIONIST"].includes(user?.role || "") && b.status === "CHECKED_IN";
  
  const formatMoney = (amount: number) => 
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  return (
    <div className="container py-16 mb-24 lg:mb-32">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Booking Details</h2>
          <button className="flex items-center text-primary-6000 hover:text-primary-700 font-medium bg-primary-50 px-4 py-2 rounded-lg" onClick={() => window.print()}>
            <Printer className="w-5 h-5 mr-2" /> Print Invoice
          </button>
        </div>

        {error && <div className="p-4 bg-red-100 text-red-800 rounded-xl">{error}</div>}
        {success && <div className="p-4 bg-green-100 text-green-800 rounded-xl">{success}</div>}

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
          <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-3xl flex justify-between items-center print:hidden">
            <div>
              <h3 className="font-semibold text-lg">Ready for Checkout?</h3>
              <p className="text-neutral-500 text-sm">Process payment and complete checkout.</p>
            </div>
            <ButtonPrimary onClick={handleCheckout} loading={checkoutLoading} disabled={checkoutLoading || invoice.balance_due < 0}>
              <CreditCard className="w-5 h-5 mr-2" /> 
              Pay {formatMoney(invoice.balance_due)} & Checkout
            </ButtonPrimary>
          </div>
        )}
      </div>
    </div>
  );
}
