"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import DashboardLayout from "../dashboard/layout";
import { useRouter } from "next/navigation";
import type { ServiceOrder, OrderStatus } from "@/types/hotel";
import useRealtimeOrders from "@/hooks/useRealtimeOrders";
import { Clock, CheckCircle2, ChefHat } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function OrdersQueuePage() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?status=PENDING,IN_PROGRESS");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Hook into Supabase realtime updates — stable callback prevents infinite re-subscriptions
  useRealtimeOrders(fetchOrders);

  useEffect(() => {
    if (!isLoading) {
      if (!user || !["ADMIN", "KITCHEN", "RECEPTIONIST"].includes(user.role)) {
        router.push("/dashboard");
      } else {
        fetchOrders();
      }
    }
  }, [user, isLoading, router, fetchOrders]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      // Realtime subscription will handle the UI refresh, but optimistic update is nice too
      setOrders(
        orders.filter(
          (o) =>
            o.id !== id ||
            (status === "IN_PROGRESS" && o.status !== "IN_PROGRESS"),
        ),
      );
      if (status === "IN_PROGRESS") {
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || loading)
    return <div className="container py-20">{t("ordersLoading")}</div>;

  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const inProgressOrders = orders.filter((o) => o.status === "IN_PROGRESS");

  const OrderCard = ({ order }: { order: ServiceOrder }) => (
    <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xl font-bold">
            Room {order.booking?.room?.room_number}
          </div>
          <div className="text-sm text-neutral-500 flex items-center mt-1">
            <Clock className="w-4 h-4 mr-1" />
            {new Date(order.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            order.status === "PENDING"
              ? "bg-amber-100 text-amber-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {order.status}
        </span>
      </div>

      <div className="border-t border-b border-neutral-100 dark:border-neutral-800 py-3 space-y-2">
        {order.items?.map((item: any, i: number) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className="font-medium">
              {item.quantity}x {item.service?.name}
            </span>
            <span className="text-neutral-500">{item.service?.category}</span>
          </div>
        ))}
        {order.notes && (
          <div className="mt-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded text-sm italic">
            {t("ordersNoteLabel")} {order.notes}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-1">
        {order.status === "PENDING" ? (
          <button
            onClick={() => updateStatus(order.id, "IN_PROGRESS")}
            className="flex-1 mr-2 bg-primary-6000 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center justify-center"
          >
            <ChefHat className="w-4 h-4 mr-2" /> {t("ordersStartPreparing")}
          </button>
        ) : (
          <button
            onClick={() => updateStatus(order.id, "COMPLETED")}
            className="flex-1 mr-2 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> {t("ordersMarkCompleted")}
          </button>
        )}
        <button
          onClick={() => updateStatus(order.id, "CANCELLED")}
          className="px-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 py-2 rounded-lg text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          {t("ordersCancel")}
        </button>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="container py-16 mb-24 lg:mb-32">
      <h2 className="text-3xl font-semibold sm:text-4xl mb-10">
        {t("ordersLiveOrderQueue")}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Column */}
        <div className="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-3xl min-h-[500px]">
          <h3 className="text-xl font-semibold mb-6 flex items-center justify-between">
            <span>{t("ordersIncomingOrders")}</span>
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
              {pendingOrders.length}
            </span>
          </h3>
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {pendingOrders.length === 0 && (
              <div className="text-center text-neutral-500 py-10">
                {t("ordersNoPendingOrders")}
              </div>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-3xl min-h-[500px]">
          <h3 className="text-xl font-semibold mb-6 flex items-center justify-between">
            <span>{t("ordersInPreparation")}</span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {inProgressOrders.length}
            </span>
          </h3>
          <div className="space-y-4">
            {inProgressOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {inProgressOrders.length === 0 && (
              <div className="text-center text-neutral-500 py-10">
                {t("ordersNoOrdersInProgress")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
