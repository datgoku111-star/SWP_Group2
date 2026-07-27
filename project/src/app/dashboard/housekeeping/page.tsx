"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, AlertTriangle, RefreshCw, Layers, ShieldAlert, Wrench, Check, ArrowRight, BedDouble, Clock, CheckCheck, Plus, ClipboardList, Shirt, Truck, SprayCan, Zap } from "lucide-react";
import ButtonPrimary from "@/shared/ButtonPrimary";
import ButtonThird from "@/shared/ButtonThird";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { translateService } from "@/utils/laundry";

export interface RoomTurnover {
  id: string;
  room_number: string;
  floor: number;
  status: "AVAILABLE" | "IN_USE" | "DIRTY" | "CLEANING" | "MAINTENANCE";
  notes?: string;
  room_type?: {
    name: string;
  };
  last_cleaned?: string;
}

function ReceptIncidentPanel({ receptFilterStatus, checkoutRequests, filteredRooms, incidents, changeStatus, fetchRooms }: {
  receptFilterStatus: string;
  checkoutRequests: any[];
  filteredRooms: RoomTurnover[];
  incidents: any[];
  changeStatus: (id: string, status: any, notes?: string) => Promise<void>;
  fetchRooms: () => Promise<void>;
}) {
  const statusConfig: Record<string, { label: string; emptyText: string; badgeClass: string; cardBorderClass: string; badgeBg: string; }> = {
    DIRTY: { label: "🟡 Luồng 1: Chờ Dọn (DIRTY)", emptyText: "🎉 Không có phòng nào đang chờ dọn!", badgeClass: "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60", cardBorderClass: "border-amber-300 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20", badgeBg: "bg-amber-500" },
    MAINTENANCE: { label: "🔴 Luồng 2: Bảo Trì (MAINTENANCE)", emptyText: "✅ Không có phòng nào đang bảo trì!", badgeClass: "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/60", cardBorderClass: "border-red-300 dark:border-red-800/60 bg-red-50/50 dark:bg-red-950/20", badgeBg: "bg-red-600" },
    IN_USE: { label: "🔵 Luồng 3: Đang Có Khách (IN_USE)", emptyText: "Không có phòng nào đang có khách.", badgeClass: "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60", cardBorderClass: "border-blue-300 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20", badgeBg: "bg-blue-600" },
    AVAILABLE: { label: "🟢 Luồng 4: Sẵn Sàng (AVAILABLE)", emptyText: "Không có phòng nào ở trạng thái sẵn sàng.", badgeClass: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60", cardBorderClass: "border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20", badgeBg: "bg-emerald-600" },
    CLEANING: { label: "🟣 Đang Dọn (CLEANING)", emptyText: "Không có phòng nào đang được dọn.", badgeClass: "text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60", cardBorderClass: "border-indigo-300 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/20", badgeBg: "bg-indigo-500" },
    CHECKOUT: { label: "🟣 Yêu Cầu Checkout (Chờ Kiểm Tra)", emptyText: "Không có yêu cầu checkout nào.", badgeClass: "text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60", cardBorderClass: "border-purple-300 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20", badgeBg: "bg-purple-600" },
  };
  const cfg = statusConfig[receptFilterStatus] || statusConfig["DIRTY"];
  const count = receptFilterStatus === "CHECKOUT" ? checkoutRequests.length : filteredRooms.length;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 dark:border-neutral-700 space-y-6">
      <div className="border-b border-neutral-100 dark:border-neutral-700 pb-4">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          {cfg.label}
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.badgeClass}`}>{count} phòng</span>
        </h2>
        <p className="text-xs text-neutral-500 mt-1">Bấm vào ô thống kê ở trên để lọc theo trạng thái. Chọn dropdown để thay đổi trạng thái phòng.</p>
      </div>

      {receptFilterStatus === "CHECKOUT" ? (
        checkoutRequests.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">{cfg.emptyText}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {checkoutRequests.map((req: any) => (
              <div key={req.id} className={`border-2 ${cfg.cardBorderClass} p-6 rounded-3xl flex flex-col space-y-3 shadow-sm`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`${cfg.badgeBg} text-white font-extrabold px-3.5 py-1.5 rounded-2xl text-base shadow`}>Phòng {req.room?.room_number}</span>
                    <h4 className="text-lg font-bold text-neutral-900 dark:text-white mt-2">{req.user?.full_name || req.guest?.full_name || "Khách"}</h4>
                  </div>
                  <span className={`text-xs font-bold ${cfg.badgeClass} px-3 py-1 rounded-full uppercase`}>Chờ Kiểm Tra</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredRooms.length === 0 ? (
        <div className="p-12 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">{cfg.emptyText}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRooms.map((room) => {
            const roomIncident = incidents.find((inc: any) => inc.room_id === room.id);
            return (
              <div key={room.id} className={`border-2 ${cfg.cardBorderClass} p-6 rounded-3xl flex flex-col space-y-4 shadow-sm`}>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`${cfg.badgeBg} text-white font-extrabold px-3.5 py-1.5 rounded-2xl text-base shadow`}>Phòng {room.room_number}</span>
                    <h4 className="text-lg font-bold text-neutral-900 dark:text-white mt-2">{room.room_type?.name || "—"} — Tầng {room.floor}</h4>
                  </div>
                  <span className={`text-xs font-bold ${cfg.badgeClass} px-3 py-1 rounded-full uppercase`}>{room.status}</span>
                </div>

                {/* Full incident detail for MAINTENANCE rooms */}
                {receptFilterStatus === "MAINTENANCE" && roomIncident ? (
                  <div className="space-y-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-red-200 dark:border-red-800/40">
                    <div className="flex items-start gap-2.5 text-sm text-red-900 dark:text-red-200">
                      <Wrench className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div><strong>Sự cố / Hư hỏng:</strong> {roomIncident.description || "Đang kiểm tra"}</div>
                    </div>

                    {roomIncident.detailed_note && (
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 pl-7 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-2">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">Chi tiết:</span> {roomIncident.detailed_note}
                      </div>
                    )}

                    {roomIncident.incident_evidence && roomIncident.incident_evidence.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-neutral-500 mb-2">📷 Ảnh hiện trường:</p>
                        <img
                          src={roomIncident.incident_evidence[0].file_url}
                          alt="Ảnh hiện trường sự cố"
                          className="w-full max-h-48 object-cover rounded-2xl border-2 border-red-200 dark:border-red-800/50 shadow-sm"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 border border-amber-200 dark:border-amber-800/40 text-center">
                        <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase">Ước tính thiệt hại</p>
                        <p className="text-base font-extrabold text-amber-800 dark:text-amber-300 mt-1">
                          {roomIncident.estimated_charge > 0 ? `$${roomIncident.estimated_charge}` : "Chưa định giá"}
                        </p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800/40 text-center">
                        <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Đã duyệt tính phí</p>
                        <p className="text-base font-extrabold text-emerald-800 dark:text-emerald-300 mt-1">
                          {roomIncident.approved_charge > 0 ? `$${roomIncident.approved_charge}` : "Chưa duyệt"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-[11px] font-semibold text-neutral-500 mb-1">Duyệt mức bồi thường (USD):</label>
                        <input
                          type="number" min="0" step="0.5"
                          id={`approve-charge-${room.id}`}
                          defaultValue={roomIncident.approved_charge || roomIncident.estimated_charge || 0}
                          className="w-full text-sm rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 dark:text-white py-2 px-3 font-semibold"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          const el = document.getElementById(`approve-charge-${room.id}`) as HTMLInputElement;
                          const charge = parseFloat(el?.value || "0");
                          const res = await fetch(`/api/incidents/${roomIncident.id}`, {
                            method: "PATCH", headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ approved_charge: charge }),
                          });
                          if (res.ok) { await fetchRooms(); alert(`✅ Đã duyệt $${charge} cho phòng ${room.room_number}`); }
                          else alert("❌ Lỗi khi duyệt phí.");
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all whitespace-nowrap"
                      >
                        💲 Duyệt phí
                      </button>
                    </div>

                    <button
                      onClick={async () => {
                        if (!confirm(`Nghiệm thu xong phòng ${room.room_number} và chuyển về AVAILABLE?`)) return;
                        await fetch(`/api/incidents/${roomIncident.id}`, {
                          method: "PATCH", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "RESOLVED", note: "Lễ tân nghiệm thu hoàn tất" }),
                        });
                        await changeStatus(room.id, "AVAILABLE", "Đã sửa chữa xong & vệ sinh sạch sẽ");
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow flex items-center justify-center gap-2 text-sm"
                    >
                      <CheckCheck className="w-5 h-5" />
                      ✅ NGHIỆM THU XONG — Chuyển về AVAILABLE
                    </button>
                  </div>
                ) : (
                  <>
                    {room.notes && (
                      <div className="bg-white dark:bg-neutral-900 p-3 rounded-2xl text-xs text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div><strong>Ghi chú:</strong> {room.notes.includes("DAMAGE:") ? room.notes.split("|")[0] : room.notes}</div>
                      </div>
                    )}
                    <div className="text-xs text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Lần dọn gần nhất: {room.last_cleaned || "—"}
                    </div>
                  </>
                )}

                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1.5">Thay đổi trạng thái:</label>
                  <select
                    value={room.status}
                    onChange={(e) => changeStatus(room.id, e.target.value as any)}
                    className="block w-full text-xs rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 dark:text-white py-2.5 px-3 font-semibold"
                  >
                    <option value="AVAILABLE">✅ AVAILABLE — Sẵn sàng đón khách</option>
                    <option value="IN_USE">🔵 IN_USE — Đang có khách</option>
                    <option value="DIRTY">🟡 DIRTY — Chưa dọn</option>
                    <option value="CLEANING">🟣 CLEANING — Đang dọn</option>
                    <option value="MAINTENANCE">🔴 MAINTENANCE — Đang bảo trì</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function HousekeepingDashboardHub() {
  const { t, i18n } = useTranslation();
  const isVN = i18n.language === "vn";
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeWorkflow, setActiveWorkflow] = useState<"DIRTY_FLOW" | "MAINTENANCE_FLOW" | "IN_USE_FLOW" | "AVAILABLE_FLOW" | "LAUNDRY_FLOW" | "CHECKOUT_FLOW">("DIRTY_FLOW");
  const [receptFilterStatus, setReceptFilterStatus] = useState<string>("DIRTY");
    const [checkoutRequests, setCheckoutRequests] = useState<any[]>([]);
  const [reportingRoomId, setReportingRoomId] = useState<string | null>(null);
  const [selectedDamages, setSelectedDamages] = useState<{name: string, price: number}[]>([]);
  const [customDamageName, setCustomDamageName] = useState("");
  const [customDamagePrice, setCustomDamagePrice] = useState("");
  const [isSubmittingDamage, setIsSubmittingDamage] = useState(false);
  const [targetBookingId, setTargetBookingId] = useState<string | null>(null);
  const [damageNote, setDamageNote] = useState("");
  const [damageImage, setDamageImage] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<any[]>([]);

  const fetchIncidents = async () => {
    try {
      const res = await fetch("/api/incidents?active=true");
      if (res.ok) {
        const data = await res.json();
        setIncidents(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch active incidents:", e);
    }
  };

  const handleToggleDamage = (damage: {name: string, price: number}) => {
    setSelectedDamages(prev => 
      prev.find(d => d.name === damage.name) 
        ? prev.filter(d => d.name !== damage.name)
        : [...prev, damage]
    );
  };
  const [rooms, setRooms] = useState<RoomTurnover[]>([]);
  const [loading, setLoading] = useState(true);
  const [laundryOrders, setLaundryOrders] = useState<any[]>([]);
  const [laundryLoading, setLaundryLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !["ADMIN", "HOUSEKEEPING", "RECEPTIONIST"].includes(user.role)) {
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, router]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      fetchIncidents();
      const res = await fetch("/api/rooms?all=true");
      const coRes = await fetch("/api/housekeeping/checkout-requests");
      
      if (coRes.ok) {
        const coData = await coRes.json();
        setCheckoutRequests(coData);
      }

      if (!res.ok) throw new Error("KhÃ´ng thá»ƒ táº£i tráº¡ng thÃ¡i buá»“ng phÃ²ng");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setRooms(data);
      } else {
        // Fallback realistic active demo dataset covering all 4 workflows cleanly
        setRooms([
          { id: "r-101", room_number: "P101", floor: 1, status: "DIRTY", notes: "KhÃ¡ch vá»«a Check-out lÃºc 12:00, cáº§n dá»n tá»•ng vá»‡ sinh & thay ga giÆ°á»ng", room_type: { name: "Deluxe Ocean View" }, last_cleaned: "HÃ´m qua" },
          { id: "r-102", room_number: "P102", floor: 1, status: "AVAILABLE", room_type: { name: "Standard Garden" }, last_cleaned: "10:30 SÃ¡ng nay" },
          { id: "r-201", room_number: "P201", floor: 2, status: "DIRTY", notes: "KhÃ¡ch VIP nháº­n phÃ²ng lÃºc 14:00 (Æ¯u tiÃªn gáº¥p sá»‘ 1)", room_type: { name: "Suite Premium" }, last_cleaned: "HÃ´m qua" },
          { id: "r-202", room_number: "P202", floor: 2, status: "IN_USE", notes: "KhÃ¡ch yÃªu cáº§u dá»n phÃ²ng lÃºc 15:00 & thÃªm 2 chai nÆ°á»›c khoÃ¡ng", room_type: { name: "Family King" }, last_cleaned: "HÃ´m qua" },
          { id: "r-301", room_number: "P301", floor: 3, status: "MAINTENANCE", notes: "VÃ²i hoa sen nhÃ  táº¯m bá»‹ rÃ² rá»‰ nÆ°á»›c, thá»£ Ä‘iá»‡n nÆ°á»›c Ä‘ang kiá»ƒm tra", room_type: { name: "Presidential Suite" }, last_cleaned: "3 ngÃ y trÆ°á»›c" },
          { id: "r-302", room_number: "P302", floor: 3, status: "MAINTENANCE", notes: "Äiá»u hÃ²a kÃªu to lÃºc ban Ä‘Ãªm, Ä‘ang thay block Ä‘iá»u hÃ²a", room_type: { name: "Deluxe Ocean View" }, last_cleaned: "2 ngÃ y trÆ°á»›c" },
          { id: "r-401", room_number: "VIP_01", floor: 4, status: "AVAILABLE", notes: "PhÃ²ng tá»•ng thá»‘ng sáºµn sÃ ng Ä‘Ã³n Ä‘oÃ n ngoáº¡i giao", room_type: { name: "Royal VIP Suite" }, last_cleaned: "09:00 SÃ¡ng nay" },
        ]);
      }
    } catch (err) {
      console.error("Housekeeping fetch error:", err);
      // Fallback demo
      setRooms([
        { id: "r-101", room_number: "P101", floor: 1, status: "DIRTY", notes: "KhÃ¡ch tráº£ phÃ²ng lÃºc 12:00, dá»n thay ga", room_type: { name: "Deluxe Ocean View" } },
        { id: "r-201", room_number: "P201", floor: 2, status: "DIRTY", notes: "KhÃ¡ch VIP 14:00", room_type: { name: "Suite Premium" } },
        { id: "r-301", room_number: "P301", floor: 3, status: "MAINTENANCE", notes: "Há»ng vÃ²i hoa sen", room_type: { name: "Presidential Suite" } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLaundryOrders = async () => {
    try {
      const res = await fetch("/api/laundry-bookings");
      if (res.ok) {
        const data = await res.json();
        setLaundryOrders(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch laundry orders:", err);
    } finally {
      setLaundryLoading(false);
    }
  };

  const handleUpdateLaundryStatus = async (id: string, status: string, statusText: string) => {
    try {
      const res = await fetch(`/api/laundry-bookings?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, status_text: statusText }),
      });
      if (res.ok) {
        fetchLaundryOrders();
      } else {
        alert("KhÃ´ng thá»ƒ cáº­p nháº­t tráº¡ng thÃ¡i Ä‘Æ¡n giáº·t lÃ .");
      }
    } catch (err) {
      console.error("Failed to update laundry status:", err);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchLaundryOrders();
    const interval = setInterval(fetchLaundryOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const changeStatus = async (roomId: string, newStatus: RoomTurnover["status"], additionalNotes?: string) => {
    const backupRooms = [...rooms];
    const updatedNotes = additionalNotes !== undefined ? additionalNotes : "";

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          const finalNotes = additionalNotes !== undefined ? additionalNotes : r.notes;
          const updatedTime = newStatus === "AVAILABLE" ? "Vá»«a xong (" + new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + ")" : r.last_cleaned;
          return { ...r, status: newStatus, notes: finalNotes, last_cleaned: updatedTime };
        }
        return r;
      })
    );

    if (!roomId.startsWith("r-")) {
      try {
        const res = await fetch(`/api/rooms/${roomId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, notes: updatedNotes }),
        });
        if (!res.ok) {
          const errData = await res.json();
          setRooms(backupRooms);
          alert(`Lá»—i cáº­p nháº­t: ${errData.error || "YÃªu cáº§u bá»‹ há»‡ thá»‘ng tá»« chá»‘i."}`);
        }
      } catch (err) {
        console.error("Failed status change:", err);
        setRooms(backupRooms);
        alert("Lá»—i káº¿t ná»‘i máº¡ng, khÃ´ng thá»ƒ lÆ°u tráº¡ng thÃ¡i má»›i.");
      }
    }
  };

  const dirtyRooms = rooms.filter((r) => r.status === "DIRTY" || r.status === "CLEANING");
  const maintenanceRooms = rooms.filter((r) => r.status === "MAINTENANCE");
  const inUseRooms = rooms.filter((r) => r.status === "IN_USE");
  const availableRooms = rooms.filter((r) => r.status === "AVAILABLE");

  const handleCompleteInspection = async (bookingId: string, roomId: string, hasDamage: boolean) => {
    if (hasDamage) {
      setTargetBookingId(bookingId);
      setReportingRoomId(roomId);
      return;
    }

    try {
      const res = await fetch("/api/housekeeping/checkout-requests/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, roomId, hasDamage, damageDescription: "", estimatedCharge: 0 }),
      });
      if (res.ok) {
        alert("ÄÃ£ hoÃ n táº¥t kiá»ƒm tra phÃ²ng.");
        fetchRooms();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error completing inspection");
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-neutral-50 dark:bg-neutral-900 min-h-screen rounded-2xl">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-3">
              Housekeeping Operations Hub
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                â— 4 Luá»“ng Nghiá»‡p Vá»¥ ChuyÃªn Biá»‡t
              </span>
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
              PhÃ¢n chia riÃªng tá»«ng luá»“ng: Dá»n phÃ²ng tráº£, Sá»­a chá»¯a báº£o trÃ¬, ChÄƒm sÃ³c phÃ²ng Ä‘ang á»Ÿ vÃ  Kiá»ƒm duyá»‡t phÃ²ng sáºµn sÃ ng.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ButtonThird onClick={fetchRooms} sizeClass="px-4 py-2.5">
            <RefreshCw className="w-4 h-4 mr-2" />
            LÃ m Má»›i Dá»¯ Liá»‡u
          </ButtonThird>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        <div
          onClick={() => { setActiveWorkflow("CHECKOUT_FLOW"); setReceptFilterStatus("CHECKOUT"); }}
          className={`p-6 rounded-3xl border transition-all cursor-pointer ${
            (user?.role === "RECEPTIONIST" ? receptFilterStatus === "CHECKOUT" : activeWorkflow === "CHECKOUT_FLOW")
              ? "bg-purple-600 text-white shadow-xl shadow-purple-600/30 scale-[1.02]"
              : "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40 hover:bg-purple-100/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-sm font-bold ${(user?.role === "RECEPTIONIST" ? receptFilterStatus === "CHECKOUT" : activeWorkflow === "CHECKOUT_FLOW") ? "text-white" : "text-purple-800 dark:text-purple-300"}`}>
              ðŸŸ£ CHECKOUT INSPECT
            </p>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold mt-2">{checkoutRequests.length}</h3>
          <p className={`text-xs mt-1 ${(user?.role === "RECEPTIONIST" ? receptFilterStatus === "CHECKOUT" : activeWorkflow === "CHECKOUT_FLOW") ? "text-purple-100" : "text-neutral-500"}`}>Checkout requests</p>
        </div>

        <div
          onClick={() => { setActiveWorkflow("DIRTY_FLOW"); setReceptFilterStatus("DIRTY"); }}
          className={`p-6 rounded-3xl border transition-all cursor-pointer ${
            (user?.role === "RECEPTIONIST" ? receptFilterStatus === "DIRTY" : activeWorkflow === "DIRTY_FLOW")
              ? "bg-amber-500 text-white shadow-xl shadow-amber-500/30 scale-[1.02]"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40 hover:bg-amber-100/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-sm font-bold ${(user?.role === "RECEPTIONIST" ? receptFilterStatus === "DIRTY" : activeWorkflow === "DIRTY_FLOW") ? "text-white" : "text-amber-800 dark:text-amber-300"}`}>
              ðŸŸ¡ Luá»“ng 1: Chá» Dá»n (DIRTY)
            </p>
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold mt-2">{dirtyRooms.length}</h3>
          <p className={`text-xs mt-1 ${(user?.role === "RECEPTIONIST" ? receptFilterStatus === "DIRTY" : activeWorkflow === "DIRTY_FLOW") ? "text-amber-100" : "text-neutral-500"}`}>KhÃ¡ch vá»«a tráº£ phÃ²ng</p>
        </div>

        <div
          onClick={() => { setActiveWorkflow("MAINTENANCE_FLOW"); setReceptFilterStatus("MAINTENANCE"); }}
          className={`p-6 rounded-3xl border transition-all cursor-pointer ${
            (user?.role === "RECEPTIONIST" ? receptFilterStatus === "MAINTENANCE" : activeWorkflow === "MAINTENANCE_FLOW")
              ? "bg-red-600 text-white shadow-xl shadow-red-600/30 scale-[1.02]"
              : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/40 hover:bg-red-100/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-sm font-bold ${(user?.role === "RECEPTIONIST" ? receptFilterStatus === "MAINTENANCE" : activeWorkflow === "MAINTENANCE_FLOW") ? "text-white" : "text-red-800 dark:text-red-300"}`}>
              ðŸ”´ Luá»“ng 2: Báº£o TrÃ¬ (MAINTENANCE)
            </p>
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold mt-2">{maintenanceRooms.length}</h3>
          <p className={`text-xs mt-1 ${(user?.role === "RECEPTIONIST" ? receptFilterStatus === "MAINTENANCE" : activeWorkflow === "MAINTENANCE_FLOW") ? "text-red-100" : "text-neutral-500"}`}>Äang sá»­a chá»¯a ká»¹ thuáº­t</p>
        </div>

        <div
          onClick={() => { setActiveWorkflow("IN_USE_FLOW"); setReceptFilterStatus("IN_USE"); }}
          className={`p-6 rounded-3xl border transition-all cursor-pointer ${
            (user?.role === "RECEPTIONIST" ? receptFilterStatus === "IN_USE" : activeWorkflow === "IN_USE_FLOW")
              ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-[1.02]"
              : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40 hover:bg-blue-100/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-sm font-bold ${(user?.role === "RECEPTIONIST" ? receptFilterStatus === "IN_USE" : activeWorkflow === "IN_USE_FLOW") ? "text-white" : "text-blue-800 dark:text-blue-300"}`}>
              ðŸ”µ Luá»“ng 3: Äang á»ž (IN_USE)
            </p>
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold mt-2">{inUseRooms.length}</h3>
          <p className={`text-xs mt-1 ${(user?.role === "RECEPTIONIST" ? receptFilterStatus === "IN_USE" : activeWorkflow === "IN_USE_FLOW") ? "text-blue-100" : "text-neutral-500"}`}>Dá»n vá»‡ sinh lÆ°u trÃº hÃ ng ngÃ y</p>
        </div>

        <div
          onClick={() => { setActiveWorkflow("AVAILABLE_FLOW"); setReceptFilterStatus("AVAILABLE"); }}
          className={`p-6 rounded-3xl border transition-all cursor-pointer ${
            (user?.role === "RECEPTIONIST" ? receptFilterStatus === "AVAILABLE" : activeWorkflow === "AVAILABLE_FLOW")
              ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 scale-[1.02]"
              : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-sm font-bold ${(user?.role === "RECEPTIONIST" ? receptFilterStatus === "AVAILABLE" : activeWorkflow === "AVAILABLE_FLOW") ? "text-white" : "text-emerald-800 dark:text-emerald-300"}`}>
              ðŸŸ¢ Luá»“ng 4: Sáºµn SÃ ng (AVAILABLE)
            </p>
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold mt-2">{availableRooms.length}</h3>
          <p className={`text-xs mt-1 ${(user?.role === "RECEPTIONIST" ? receptFilterStatus === "AVAILABLE" : activeWorkflow === "AVAILABLE_FLOW") ? "text-emerald-100" : "text-neutral-500"}`}>PhÃ²ng sáº¡ch sáºµn sÃ ng Ä‘Ã³n khÃ¡ch</p>
        </div>
      </div>

      {/* Navigation Tabs Bar â€” only for HOUSEKEEPING & ADMIN */}
      {user?.role !== "RECEPTIONIST" && (
      <div className="flex items-center gap-3 overflow-x-auto border-b border-neutral-200 dark:border-neutral-700 pb-4">
        <button
          onClick={() => setActiveWorkflow("DIRTY_FLOW")}
          className={`px-5 py-3 rounded-2xl text-sm font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeWorkflow === "DIRTY_FLOW"
              ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
              : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Luá»“ng 1: Dá»n Buá»“ng Tráº£ (Check-Out âž” DIRTY âž” AVAILABLE) ({dirtyRooms.length})
        </button>

        <button
          onClick={() => setActiveWorkflow("MAINTENANCE_FLOW")}
          className={`px-5 py-3 rounded-2xl text-sm font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeWorkflow === "MAINTENANCE_FLOW"
              ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
              : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
          }`}
        >
          <Wrench className="w-4 h-4" />
          Luá»“ng 2: Sá»­a Chá»¯a Báº£o TrÃ¬ (MAINTENANCE âž” Nghiá»‡m Thu) ({maintenanceRooms.length})
        </button>

        <button
          onClick={() => setActiveWorkflow("IN_USE_FLOW")}
          className={`px-5 py-3 rounded-2xl text-sm font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeWorkflow === "IN_USE_FLOW"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Luá»“ng 3: Dá»n PhÃ²ng HÃ ng NgÃ y (IN_USE) ({inUseRooms.length})
        </button>

        <button
          onClick={() => setActiveWorkflow("AVAILABLE_FLOW")}
          className={`px-5 py-3 rounded-2xl text-sm font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeWorkflow === "AVAILABLE_FLOW"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
              : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          Luá»“ng 4: RÃ  SoÃ¡t Sáºµn SÃ ng (AVAILABLE) ({availableRooms.length})
        </button>

        <button
          onClick={() => setActiveWorkflow("LAUNDRY_FLOW")}
          className={`px-5 py-3 rounded-2xl text-sm font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeWorkflow === "LAUNDRY_FLOW"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
          }`}
        >
          <Shirt className="w-4 h-4" />
          {isVN ? "Luá»“ng 5: Dá»‹ch Vá»¥ Giáº·t LÃ " : "Flow 5: Laundry Services"} (Laundry Orders) ({laundryOrders.filter(o => ["assigned", "washing", "ready_to_receive", "delivering"].includes(o.status_text)).length})
        </button>
      </div>
      )}

      {/* RECEPTIONIST VIEW â€” Filtered Detail Cards */}
      {user?.role === "RECEPTIONIST" && (
        <ReceptIncidentPanel
          receptFilterStatus={receptFilterStatus}
          checkoutRequests={checkoutRequests}
          filteredRooms={rooms.filter(r => receptFilterStatus === "CHECKOUT" ? false : r.status === receptFilterStatus)}
          incidents={incidents}
          changeStatus={changeStatus}
          fetchRooms={fetchRooms}
        />
      )}


      {/* All Workflow flows â€” only for HOUSEKEEPING & ADMIN */}
      {user?.role !== "RECEPTIONIST" && (
        <>
        {/* WORKFLOW 5: CHECKOUT INSPECTION FLOW */}
        {activeWorkflow === "CHECKOUT_FLOW" && (
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 dark:border-neutral-700 space-y-6">
          <div className="border-b border-neutral-100 dark:border-neutral-700 pb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              ðŸŸ£ CHECKOUT INSPECTION FLOW
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Guest requested checkout. Receptionist dispatched you to inspect for damages or lost items before payment.
            </p>
          </div>

          {checkoutRequests.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
              No checkout inspection requests at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {checkoutRequests.map((req) => (
                <div key={req.id} className="bg-purple-50/60 dark:bg-purple-950/20 border-2 border-purple-300 dark:border-purple-800/60 p-6 rounded-3xl flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="bg-purple-600 text-white font-extrabold px-3.5 py-1.5 rounded-2xl text-base shadow">
                        PhÃ²ng {req.room?.room_number}
                      </span>
                      <h4 className="text-lg font-bold text-neutral-900 dark:text-white mt-2">
                        {req.user?.full_name || req.guest?.full_name}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-200 dark:bg-purple-900/60 px-3 py-1 rounded-full uppercase">
                      Chá» Kiá»ƒm Tra
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleCompleteInspection(req.id, req.room_id, false)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow flex items-center justify-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      PhÃ²ng BÃ¬nh ThÆ°á»ng
                    </button>
                    <button
                      onClick={() => handleCompleteInspection(req.id, req.room_id, true)}
                      className="bg-red-100 dark:bg-red-900/40 hover:bg-red-200 text-red-800 dark:text-red-300 font-semibold py-3 px-4 rounded-2xl transition-all text-sm flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      BÃ¡o Há»ng / Máº¥t Äá»“
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WORKFLOW 1: DIRTY TURNOVER FLOW */}
      {activeWorkflow === "DIRTY_FLOW" && (
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 dark:border-neutral-700 space-y-6">
          <div className="border-b border-neutral-100 dark:border-neutral-700 pb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              ðŸŸ¡ LUá»’NG 1: QUY TRÃŒNH Dá»ŒN Dáº¸P PHÃ’NG KHÃCH Vá»ªA TRáº¢ (Check-Out Turnover)
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Khi khÃ¡ch lÃ m thá»§ tá»¥c Check-Out táº¡i Lá»… tÃ¢n, phÃ²ng láº­p tá»©c chuyá»ƒn sang tráº¡ng thÃ¡i <strong>ChÆ°a Dá»n (DIRTY)</strong>. NhÃ¢n viÃªn buá»“ng phÃ²ng dá»n dáº¹p, thay ga, bá»• sung tiá»‡n Ã­ch rá»“i báº¥m <strong>"âœ¨ HOÃ€N Táº¤T Dá»ŒN Dáº¸P"</strong> Ä‘á»ƒ bÃ n giao ngay cho Lá»… tÃ¢n Ä‘Ã³n khÃ¡ch má»›i.
            </p>
          </div>

          {dirtyRooms.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
              ðŸŽ‰ Tuyá»‡t vá»i! Táº¥t cáº£ buá»“ng phÃ²ng tráº£ Ä‘á»u Ä‘Ã£ Ä‘Æ°á»£c dá»n dáº¹p sáº¡ch sáº½ vÃ  bÃ n giao cho Lá»… tÃ¢n.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dirtyRooms.map((room) => (
                <div key={room.id} className="bg-amber-50/60 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800/60 p-6 rounded-3xl flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="bg-amber-500 text-white font-extrabold px-3.5 py-1.5 rounded-2xl text-base shadow">
                        PhÃ²ng {room.room_number}
                      </span>
                      <h4 className="text-lg font-bold text-neutral-900 dark:text-white mt-2">
                        {room.room_type?.name || "Deluxe Ocean"} â€” Táº§ng {room.floor}
                      </h4>
                    </div>
                    {room.status === "DIRTY" ? (
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-200 dark:bg-amber-900/60 px-3 py-1 rounded-full uppercase">
                        Chá» Dá»n (DIRTY)
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-200 dark:bg-blue-900/60 px-3 py-1 rounded-full uppercase animate-pulse">
                        Äang Dá»n Dáº¹p (CLEANING)
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {room.notes && (
                      <div className="bg-white dark:bg-neutral-900 p-3 rounded-2xl text-xs text-neutral-700 dark:text-neutral-300 border border-amber-200 dark:border-amber-800/40 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div><strong>YÃªu cáº§u / Ghi chÃº:</strong> {room.notes}</div>
                      </div>
                    )}
                    <div className="text-xs text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Láº§n dá»n gáº§n nháº¥t: {room.last_cleaned || "HÃ´m qua"}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    {room.status === "DIRTY" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => changeStatus(room.id, "CLEANING", "Äang dá»n nhanh (20p)")}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-3 rounded-xl transition-all shadow flex items-center justify-center gap-1.5 text-xs"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Dá»n nhanh 20p
                        </button>
                        <button
                          onClick={() => changeStatus(room.id, "CLEANING", "Äang dá»n ká»¹ (45p)")}
                          className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-3 rounded-xl transition-all shadow flex items-center justify-center gap-1.5 text-xs"
                        >
                          <SprayCan className="w-3.5 h-3.5" />
                          Dá»n ká»¹ 45p
                        </button>
                      </div>
                    )}
                    
                    {room.status === "CLEANING" && (
                      <button
                        onClick={() => changeStatus(room.id, "AVAILABLE")}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow flex items-center justify-center gap-2 text-sm"
                      >
                        <Sparkles className="w-4 h-4" />
                        âœ¨ HOÃ€N Táº¤T Dá»ŒN Dáº¸P (âž” AVAILABLE)
                      </button>
                    )}
                    
                    {room.status === "DIRTY" && (
                      <button
                        onClick={() => setReportingRoomId(room.id)}
                        className="bg-red-100 dark:bg-red-900/40 hover:bg-red-200 text-red-800 dark:text-red-300 font-semibold py-2 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 mx-auto w-full mt-2"
                        title="BÃ¡o lá»—i ká»¹ thuáº­t / chuyá»ƒn sang Luá»“ng 2"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        BÃ¡o Há»ng / Báº£o trÃ¬
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WORKFLOW 2: MAINTENANCE & INCIDENT FLOW */}
      {activeWorkflow === "MAINTENANCE_FLOW" && (
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 dark:border-neutral-700 space-y-6">
          <div className="border-b border-neutral-100 dark:border-neutral-700 pb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              ðŸ”´ LUá»’NG 2: QUY TRÃŒNH QUáº¢N LÃ MAINTENANCE & Sá»¬A CHá»®A Sá»° Cá» (Maintenance & Repairs)
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              CÃ¡c buá»“ng phÃ²ng gáº·p sá»± cá»‘ ká»¹ thuáº­t (Ä‘iá»‡n, nÆ°á»›c, khÃ³a cá»­a, Ä‘iá»u hÃ²a) bá»‹ khÃ³a táº¡m thá»i khá»i danh sÃ¡ch Ä‘áº·t phÃ²ng cá»§a Lá»… tÃ¢n. Khi ká»¹ thuáº­t viÃªn sá»­a chá»¯a xong vÃ  vá»‡ sinh sáº¡ch, nháº¥n <strong>"ðŸ› ï¸ Nghiá»‡m Thu Sá»­a Chá»¯a Xong"</strong> Ä‘á»ƒ khÃ´i phá»¥c phÃ²ng vá» tráº¡ng thÃ¡i <strong>AVAILABLE</strong>.
            </p>
          </div>

          {maintenanceRooms.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
              âœ… Táº¥t cáº£ thiáº¿t bá»‹ ká»¹ thuáº­t trong cÃ¡c phÃ²ng Ä‘á»u hoáº¡t Ä‘á»™ng hoÃ n háº£o! KhÃ´ng cÃ³ phÃ²ng báº£o trÃ¬.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {maintenanceRooms.map((room) => {
                const roomIncident = incidents.find((inc) => inc.room_id === room.id);
                return (
                  <div key={room.id} className="bg-red-50/60 dark:bg-red-950/20 border-2 border-red-300 dark:border-red-800/60 p-6 rounded-3xl flex flex-col justify-between space-y-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="bg-red-600 text-white font-extrabold px-3.5 py-1.5 rounded-2xl text-base shadow">
                          PhÃ²ng {room.room_number}
                        </span>
                        <h4 className="text-lg font-bold text-neutral-900 dark:text-white mt-2">
                          {room.room_type?.name || "Presidential Suite"} â€” Táº§ng {room.floor}
                        </h4>
                      </div>
                      <span className="text-xs font-bold text-red-700 dark:text-red-300 bg-red-200 dark:bg-red-900/60 px-3 py-1 rounded-full uppercase">
                        Äang Báº£o TrÃ¬ (LOCKED)
                      </span>
                    </div>

                    <div className="space-y-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-red-200 dark:border-red-800/40">
                      <div className="flex items-start gap-2.5 text-sm text-red-900 dark:text-red-200">
                        <Wrench className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Sá»± cá»‘ ká»¹ thuáº­t:</strong> {roomIncident?.description || room.notes || "Äang kiá»ƒm tra há»‡ thá»‘ng Ä‘iá»‡n nÆ°á»›c"}
                        </div>
                      </div>
                      
                      {roomIncident?.detailed_note && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 pl-7">
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300">Chi tiáº¿t:</span> {roomIncident.detailed_note}
                        </div>
                      )}

                      {roomIncident?.incident_evidence && roomIncident.incident_evidence.length > 0 && (
                        <div className="mt-3 pl-7">
                          <p className="text-[11px] font-semibold text-neutral-400 mb-1">áº¢nh hiá»‡n trÆ°á»ng:</p>
                          <img
                            src={roomIncident.incident_evidence[0].file_url}
                            alt="Evidence photo"
                            className="w-full max-h-40 object-cover rounded-xl border border-neutral-200 dark:border-neutral-700"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      {user?.role === "HOUSEKEEPING" ? (
                        <div className="text-[11px] text-neutral-500 italic text-center w-full py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                          Chá»‰ Ká»¹ thuáº­t viÃªn / GiÃ¡m sÃ¡t má»›i Ä‘Æ°á»£c Nghiá»‡m thu báº£o trÃ¬
                        </div>
                      ) : (
                        <button
                          onClick={async () => {
                            if (roomIncident) {
                              await fetch(`/api/incidents/${roomIncident.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'RESOLVED', note: 'Ká»¹ thuáº­t viÃªn nghiá»‡m thu hoÃ n táº¥t báº£o trÃ¬ phÃ²ng' })
                              });
                            }
                            await changeStatus(room.id, "AVAILABLE", "ÄÃ£ sá»­a chá»¯a xong & dá»n vá»‡ sinh sáº¡ch sáº½");
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow flex items-center justify-center gap-2 text-sm"
                        >
                          <CheckCheck className="w-5 h-5" />
                          ðŸ› ï¸ NGHIá»†M THU Sá»¬A CHá»®A XONG (âž” AVAILABLE)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* WORKFLOW 3: IN_USE STAYOVER CLEANING FLOW */}
      {activeWorkflow === "IN_USE_FLOW" && (
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 dark:border-neutral-700 space-y-6">
          <div className="border-b border-neutral-100 dark:border-neutral-700 pb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              ðŸ”µ LUá»’NG 3: QUY TRÃŒNH CHÄ‚M SÃ“C PHÃ’NG ÄANG LÆ¯U TRÃš (Stayover Make-Up Room)
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              PhÃ²ng Ä‘ang cÃ³ khÃ¡ch á»Ÿ (<strong>IN_USE</strong>) cáº§n Ä‘Æ°á»£c lÃ m vá»‡ sinh hÃ ng ngÃ y, Ä‘á»• rÃ¡c, gáº¥p chÄƒn mÃ n vÃ  bá»• sung nÆ°á»›c khoÃ¡ng/khÄƒn táº¯m/amenities theo yÃªu cáº§u cá»§a khÃ¡ch hoáº·c tiÃªu chuáº©n khÃ¡ch sáº¡n.
            </p>
          </div>

          {inUseRooms.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
              Hiá»‡n táº¡i khÃ´ng cÃ³ phÃ²ng nÃ o cÃ³ khÃ¡ch lÆ°u trÃº cáº§n dá»n dáº¹p hÃ ng ngÃ y.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inUseRooms.map((room) => (
                <div key={room.id} className="bg-blue-50/60 dark:bg-blue-950/20 border-2 border-blue-300 dark:border-blue-800/60 p-6 rounded-3xl flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="bg-blue-600 text-white font-extrabold px-3.5 py-1.5 rounded-2xl text-base shadow">
                        PhÃ²ng {room.room_number}
                      </span>
                      <h4 className="text-lg font-bold text-neutral-900 dark:text-white mt-2">
                        {room.room_type?.name || "Family King"} â€” Táº§ng {room.floor}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-200 dark:bg-blue-900/60 px-3 py-1 rounded-full uppercase">
                      Äang CÃ³ KhÃ¡ch (IN_USE)
                    </span>
                  </div>

                  {room.notes && (
                    <div className="bg-white dark:bg-neutral-900 p-3 rounded-2xl text-xs text-neutral-700 dark:text-neutral-300 border border-blue-200 dark:border-blue-800/40 flex items-start gap-2">
                      <ClipboardList className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div><strong>YÃªu cáº§u cá»§a khÃ¡ch:</strong> {room.notes}</div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        alert(`ÄÃ£ ghi nháº­n hoÃ n táº¥t dá»n phÃ²ng lÆ°u trÃº hÃ ng ngÃ y cho PhÃ²ng ${room.room_number}! Bá»• sung 2 nÆ°á»›c khoÃ¡ng & thay khÄƒn.`);
                        changeStatus(room.id, "IN_USE", "ÄÃ£ lÃ m vá»‡ sinh lÆ°u trÃº hÃ´m nay");
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl transition-all shadow flex items-center justify-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      XÃ¡c Nháº­n ÄÃ£ Dá»n HÃ ng NgÃ y (Make-Up Done)
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("Nháº­p sá»± cá»‘ phÃ¡t hiá»‡n trong phÃ²ng khÃ¡ch Ä‘ang á»Ÿ:", "Há»ng vÃ²i nÆ°á»›c nhÃ  vá»‡ sinh");
                        if (reason !== null) changeStatus(room.id, "MAINTENANCE", reason);
                      }}
                      className="bg-red-100 dark:bg-red-900/40 hover:bg-red-200 text-red-800 dark:text-red-300 font-semibold py-3 px-3 rounded-2xl transition-all text-xs"
                      title="BÃ¡o lá»—i báº£o trÃ¬"
                    >
                      BÃ¡o Há»ng
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WORKFLOW 4: AVAILABLE AUDIT FLOW */}
      {activeWorkflow === "AVAILABLE_FLOW" && (
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 dark:border-neutral-700 space-y-6">
          <div className="border-b border-neutral-100 dark:border-neutral-700 pb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              ðŸŸ¢ LUá»’NG 4: RÃ€ SOÃT & Äáº¢M Báº¢O CHáº¤T LÆ¯á»¢NG PHÃ’NG TRá»NG Sáº´N SÃ€NG (Available Audit)
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Danh sÃ¡ch buá»“ng phÃ²ng Ä‘Ã£ sáº¡ch sáº½ vÃ  Ä‘ang hiá»ƒn thá»‹ trÃªn há»‡ thá»‘ng Lá»… tÃ¢n Ä‘á»ƒ Ä‘Ã³n khÃ¡ch má»›i. GiÃ¡m sÃ¡t buá»“ng phÃ²ng (Supervisor) kiá»ƒm tra Ä‘á»‹nh ká»³ láº§n cuá»‘i trÆ°á»›c khi khÃ¡ch Check-In.
            </p>
          </div>

          {availableRooms.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
              Hiá»‡n khÃ´ng cÃ²n buá»“ng phÃ²ng trá»‘ng nÃ o.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availableRooms.map((room) => (
                <div key={room.id} className="bg-emerald-50/60 dark:bg-emerald-950/20 border-2 border-emerald-300 dark:border-emerald-800/60 p-6 rounded-3xl flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="bg-emerald-600 text-white font-extrabold px-3.5 py-1.5 rounded-2xl text-base shadow">
                        PhÃ²ng {room.room_number}
                      </span>
                      <h4 className="text-base font-bold text-neutral-900 dark:text-white mt-2">
                        {room.room_type?.name || "Deluxe Ocean"} â€” Táº§ng {room.floor}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-200 dark:bg-emerald-900/60 px-2.5 py-1 rounded-full uppercase">
                      Sáºµn SÃ ng
                    </span>
                  </div>

                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    <div>â±ï¸ Láº§n kiá»ƒm tra cuá»‘i: {room.last_cleaned || "SÃ¡ng nay"}</div>
                    {room.notes && <div className="mt-1 text-emerald-800 dark:text-emerald-300 font-medium">âœ“ {room.notes}</div>}
                  </div>

                  {user?.role === "HOUSEKEEPING" ? (
                    <div className="text-[11px] text-neutral-550 italic text-center w-full py-2 bg-emerald-100/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/30">
                      Chá»‰ GiÃ¡m sÃ¡t/Lá»… tÃ¢n má»›i Ä‘Æ°á»£c Ä‘á»•i tráº¡ng thÃ¡i phÃ²ng Sáºµn sÃ ng
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/40 flex justify-between gap-2 w-full">
                      <button
                        onClick={() => changeStatus(room.id, "DIRTY", "YÃªu cáº§u dá»n láº¡i trÆ°á»›c khi Ä‘Ã³n khÃ¡ch Ä‘oÃ n")}
                        className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 py-2 px-3 rounded-xl transition-all"
                      >
                        Dá»n Láº¡i (âž” DIRTY)
                      </button>
                      <button
                        onClick={() => changeStatus(room.id, "MAINTENANCE", "PhÃ¡t hiá»‡n lá»—i ká»¹ thuáº­t Ä‘á»™t xuáº¥t")}
                        className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 py-2 px-3 rounded-xl transition-all"
                      >
                        KhÃ³a Báº£o TrÃ¬
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WORKFLOW 5: LAUNDRY SERVICES OPERATION FLOW */}
      {activeWorkflow === "LAUNDRY_FLOW" && (
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 dark:border-neutral-700 space-y-6">
          <div className="border-b border-neutral-100 dark:border-neutral-700 pb-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Shirt className="w-5 h-5 text-indigo-500" />
              {isVN ? "LUá»’NG 5: QUY TRÃŒNH Xá»¬ LÃ YÃŠU Cáº¦U GIáº¶T LÃ€" : "FLOW 5: LAUNDRY REQUESTS PROCESSING"} (Laundry Operations)
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              {isVN ? "Nháº­n Ä‘á»“ tá»« phÃ²ng khÃ¡ch, giáº·t háº¥p sáº¥y á»§i vÃ  bÃ n giao tráº£ quáº§n Ã¡o sáº¡ch cho khÃ¡ch. Má»i hoáº¡t Ä‘á»™ng Ä‘Æ°á»£c Ä‘á»“ng bá»™ trá»±c tiáº¿p tá»›i Lá»… TÃ¢n vÃ  KhÃ¡ch HÃ ng." : "Receive items from guest rooms, wash/dry clean/press, and deliver clean clothes back to guests. All actions synced in real-time with Receptionist and Customer."}
            </p>
          </div>

          {laundryLoading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-primary-6000 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-neutral-450">{isVN ? "Äang táº£i danh sÃ¡ch Ä‘Æ¡n giáº·t lÃ ..." : "Loading laundry orders..."}</p>
            </div>
          ) : laundryOrders.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
              {isVN ? "ChÆ°a cÃ³ Ä‘Æ¡n yÃªu cáº§u giáº·t lÃ  nÃ o trong há»‡ thá»‘ng." : "No laundry requests in the system."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {laundryOrders.map((order) => {
                const isAssigned = order.status_text === "assigned";
                const isWashing = order.status_text === "washing";
                const isWashed = order.status_text === "washed";
                const isReadyToReceive = order.status_text === "ready_to_receive";
                const isDelivering = order.status_text === "delivering";
                const isDelivered = order.status_text === "delivered";
                const isRejected = order.status_text === "rejected";

                let statusBadge = "";
                let cardBorder = "";

                if (isAssigned) {
                  statusBadge = isVN ? "â³ Chá» Buá»“ng phÃ²ng thu gom Ä‘á»“" : "â³ Housekeeping collecting clothes";
                  cardBorder = "border-purple-300 dark:border-purple-800/50 bg-purple-50/20 dark:bg-purple-950/10";
                } else if (isWashing) {
                  statusBadge = isVN ? "ðŸŒ€ Äang giáº·t Ä‘á»“ (Washing)" : "ðŸŒ€ Washing in progress";
                  cardBorder = "border-amber-300 dark:border-amber-800/50 bg-amber-50/20 dark:bg-amber-950/10";
                } else if (isWashed) {
                  statusBadge = isVN ? "ðŸ‘• ÄÃ£ giáº·t xong â€” Chá» khÃ¡ch á»Ÿ phÃ²ng bÃ¡o" : "ðŸ‘• Washed â€” Waiting for guest in room";
                  cardBorder = "border-indigo-300 dark:border-indigo-800/50 bg-indigo-50/20 dark:bg-indigo-950/10";
                } else if (isReadyToReceive) {
                  statusBadge = isVN ? "â³ Chá» Lá»… tÃ¢n duyá»‡t tráº£ Ä‘á»“" : "â³ Waiting for receptionist delivery approval";
                  cardBorder = "border-orange-300 dark:border-orange-800/50 bg-orange-50/20 dark:bg-orange-950/10 animate-pulse";
                } else if (isDelivering) {
                  statusBadge = isVN ? "ðŸšš Äang tráº£ Ä‘á»“ (Delivering)" : "ðŸšš Delivering";
                  cardBorder = "border-blue-300 dark:border-blue-800/50 bg-blue-50/20 dark:bg-blue-950/10 animate-bounce";
                } else if (isDelivered) {
                  statusBadge = isVN ? "âœ… ÄÃ£ giao Ä‘á»“ thÃ nh cÃ´ng" : "âœ… Delivered successfully";
                  cardBorder = "border-emerald-300 dark:border-emerald-800/50 bg-emerald-50/20 dark:bg-emerald-950/10";
                } else {
                  statusBadge = isVN ? "âŒ Bá»‹ tá»« chá»‘i" : "âŒ Rejected";
                  cardBorder = "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/20";
                }

                return (
                  <div key={order.id} className={`border-2 p-6 rounded-3xl flex flex-col justify-between space-y-4 shadow-sm transition-all ${cardBorder}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="bg-neutral-800 text-white dark:bg-neutral-900 font-extrabold px-3 py-1 rounded-2xl text-xs shadow">
                          PhÃ²ng {order.room_number || "P-VIP"}
                        </span>
                        <h4 className="text-base font-bold text-neutral-900 dark:text-white mt-3">
                          MÃ£ Ä‘Æ¡n: #{order.id.slice(0, 8).toUpperCase()}
                        </h4>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm text-neutral-600 dark:text-neutral-300">
                        {statusBadge}
                      </span>
                    </div>

                    <div className="text-xs space-y-2">
                      <div className="font-semibold text-neutral-700 dark:text-neutral-300">
                        {isVN ? "Loáº¡i dá»‹ch vá»¥:" : "Service Type:"} <span className="text-indigo-600 dark:text-indigo-400 font-black">{order.service_type === "Wash & Fold" ? (isVN ? "Giáº·t thÆ°á»ng (Wash & Fold)" : "Wash & Fold") : order.service_type === "Dry Cleaning" ? (isVN ? "Giáº·t khÃ´ / Giáº·t háº¥p" : "Dry Cleaning") : (isVN ? "Chá»‰ á»§i / lÃ  (Pressing Only)" : "Pressing Only")}</span>
                      </div>
                      
                      {/* Items */}
                      <div className="bg-white/80 dark:bg-neutral-900/60 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-850 space-y-1">
                        <span className="text-[9px] text-neutral-400 font-bold uppercase block tracking-wider mb-1">{isVN ? "Äá»“ cáº§n giáº·t:" : "Items to wash:"}</span>
                        {order.items?.map((it: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span className="font-semibold">{it.quantity}x {translateService(it.service?.name || "Service", it.service?.description, isVN).name}</span>
                            <span className="text-neutral-500 font-mono text-[10px]">({new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(it.unit_price)}/{isVN ? "cÃ¡i" : "item"})</span>
                          </div>
                        ))}
                      </div>

                      {order.customer_notes && (
                        <div className="p-3 bg-amber-500/10 rounded-2xl text-[11px] italic text-neutral-750 dark:text-neutral-300 border border-amber-500/20">
                          <strong>{isVN ? "Ghi chÃº cá»§a khÃ¡ch:" : "Guest notes:"}</strong> {order.customer_notes}
                        </div>
                      )}
                      
                      <div className="flex justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-850">
                        <span>{isVN ? "Äáº·t lÃºc:" : "Ordered at:"} {new Date(order.created_at).toLocaleTimeString(isVN ? "vi-VN" : "en-US")} - {new Date(order.created_at).toLocaleDateString(isVN ? "vi-VN" : "en-US")}</span>
                        <span className="font-bold text-red-600 dark:text-red-400">{isVN ? "Tá»•ng cá»™ng:" : "Total:"} {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(order.total_amount || 0)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                      {isAssigned && (
                        <button
                          onClick={() => handleUpdateLaundryStatus(order.id, "PENDING", "washing")}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/50 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                        >
                          ðŸŒ€ {isVN ? "NHáº¬N Äá»’ VÃ€ ÄANG GIáº¶T" : "RECEIVE AND START WASHING"}
                        </button>
                      )}

                      {isWashing && (
                        <button
                          onClick={() => handleUpdateLaundryStatus(order.id, "PENDING", "washed")}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow flex items-center justify-center gap-2 text-xs"
                        >
                          ðŸ‘• {isVN ? "ÄÃƒ GIáº¶T XONG & Sáº´N SÃ€NG GIAO" : "WASHED & READY FOR DELIVERY"}
                        </button>
                      )}

                      {isReadyToReceive && (
                        <div className="text-[10px] text-neutral-500 italic text-center w-full py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                          â³ {isVN ? "Chá» Lá»… tÃ¢n duyá»‡t giao Ä‘á»“..." : "Waiting for receptionist delivery approval..."}
                        </div>
                      )}

                      {isDelivering && (
                        <button
                          onClick={() => handleUpdateLaundryStatus(order.id, "COMPLETED", "delivered")}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow flex items-center justify-center gap-2 text-xs animate-bounce"
                        >
                          <Truck className="w-4 h-4" /> {isVN ? "BÃ€N GIAO Äá»’ XONG (Tráº£ Äá»“)" : "DELIVERED SUCCESSFULLY"}
                        </button>
                      )}

                      {isWashed && (
                        <div className="text-[10px] text-neutral-500 italic text-center w-full py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                          â³ {isVN ? "ÄÃ£ giáº·t sáº¡ch. Äang Ä‘á»£i KhÃ¡ch hÃ ng bÃ¡o sáºµn sÃ ng á»Ÿ phÃ²ng Ä‘á»ƒ mang lÃªn tráº£..." : "Washed. Waiting for guest confirmation to deliver..."}
                        </div>
                      )}

                      {isDelivered && (
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold text-center w-full py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          âœ“ {isVN ? "ÄÃ£ tráº£ xong Ä‘á»“ & cá»™ng ná»£ phÃ²ng thÃ nh cÃ´ng" : "Delivered & debt charged successfully"}
                        </div>
                      )}

                      {isRejected && (
                        <div className="text-xs text-red-600 dark:text-red-400 font-bold text-center w-full py-2 bg-red-500/10 rounded-xl border border-red-500/20">
                          {isVN ? "ÄÆ¡n hÃ ng bá»‹ tá»« chá»‘i" : "Order rejected"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </>
      )}


      {/* MODAL BÃO Há»ŽNG / Báº¢O TRÃŒ */}
      {reportingRoomId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl border border-neutral-100 dark:border-neutral-800 animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-xl font-bold text-neutral-950 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-red-600" />
                BÃ¡o há»ng phÃ²ng {rooms.find(r => r.id === reportingRoomId)?.room_number}
              </h3>
              <button
                onClick={() => {
                  setReportingRoomId(null);
                  setSelectedDamages([]);
                  setCustomDamageName("");
                  setCustomDamagePrice("");
                  setDamageNote("");
                  setDamageImage(null);
                  setTargetBookingId(null);
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors text-2xl font-semibold"
              >
                &times;
              </button>
            </div>

            {/* PREDEFINED DAMAGES LIST */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">
                Chá»n danh má»¥c há»ng hÃ³c:
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {[
                  { name: "Há»ng Tivi", price: 150 },
                  { name: "Há»ng Äiá»u hÃ²a", price: 200 },
                  { name: "Há»ng Tá»§ láº¡nh", price: 100 },
                  { name: "BÃ¬nh nÆ°á»›c há»ng", price: 10 },
                  { name: "BÃ¬nh nÃ³ng láº¡nh há»ng", price: 80 },
                  { name: "RÃ¡ch/Báº©n Ga giÆ°á»ng", price: 30 },
                  { name: "Máº¥t/Há»ng khÄƒn táº¯m", price: 15 },
                ].map((item) => {
                  const isChecked = selectedDamages.some(d => d.name === item.name);
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleToggleDamage(item)}
                      className={`p-3 rounded-2xl border text-left text-xs transition-all flex flex-col justify-between h-16 ${
                        isChecked
                          ? "bg-red-50 dark:bg-red-950/20 border-red-500 text-red-700 dark:text-red-400 font-bold"
                          : "bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
                      }`}
                    >
                      <span>{item.name}</span>
                      <span className="opacity-80">${item.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CUSTOM DAMAGE SECTION */}
            <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">
                Há»ng hÃ³c tÃ¹y chá»‰nh khÃ¡c:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="TÃªn Ä‘á»“ dÃ¹ng hÆ° há»ng..."
                  value={customDamageName}
                  onChange={(e) => setCustomDamageName(e.target.value)}
                  className="flex-1 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="GiÃ¡ (USD)"
                  value={customDamagePrice}
                  onChange={(e) => setCustomDamagePrice(e.target.value)}
                  className="w-24 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            {/* UPLOAD IMAGE SECTION */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">
                Táº£i lÃªn hÃ¬nh áº£nh hiá»‡n trÆ°á»ng / báº±ng chá»©ng:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setDamageImage(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-xs text-neutral-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
              </div>
              {damageImage && (
                <div className="relative w-full h-24 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 mt-2">
                  <img src={damageImage} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setDamageImage(null)}
                    className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-700"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>

            {/* DETAILED NOTE */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">
                Ghi chÃº chi tiáº¿t hÆ° háº¡i:
              </label>
              <textarea
                placeholder="Ghi chÃº thÃªm vá» lá»—i ká»¹ thuáº­t, vá»‹ trÃ­ hÆ° háº¡i..."
                value={damageNote}
                onChange={(e) => setDamageNote(e.target.value)}
                rows={2}
                className="w-full text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setReportingRoomId(null);
                  setSelectedDamages([]);
                  setCustomDamageName("");
                  setCustomDamagePrice("");
                  setDamageNote("");
                  setDamageImage(null);
                  setTargetBookingId(null);
                }}
                className="flex-1 py-3 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm"
              >
                Há»§y bá»
              </button>
              <button
                type="button"
                disabled={isSubmittingDamage}
                onClick={async () => {
                  let allDamages = [...selectedDamages];
                  if (customDamageName && customDamagePrice) {
                    allDamages.push({ name: customDamageName, price: Number(customDamagePrice) || 0 });
                  }
                  
                  if (allDamages.length === 0) {
                    alert("Vui lÃ²ng chá»n hoáº·c nháº­p nháº¥t má»™t má»¥c há»ng hÃ³c.");
                    return;
                  }

                  setIsSubmittingDamage(true);
                  try {
                    const totalCharge = allDamages.reduce((sum, item) => sum + item.price, 0);
                    const description = allDamages.map(d => `${d.name} ($${d.price})`).join(', ');

                    // 1. Create incident
                    const res = await fetch('/api/incidents', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        room_id: reportingRoomId,
                        booking_id: targetBookingId || undefined,
                        incident_type: 'DAMAGE',
                        severity: 'MEDIUM',
                        description: description,
                        detailed_note: damageNote || 'BÃ¡o cÃ¡o tá»« nhÃ¢n viÃªn buá»“ng phÃ²ng',
                        estimated_charge: totalCharge,
                        is_chargeable: true,
                        evidence_image: damageImage
                      })
                    });

                    if (!res.ok) {
                      const errData = await res.json().catch(() => ({}));
                      let errMsg = errData.error || errData.message || "Failed to report incident";
                      if (errData.details) {
                        errMsg += " - Chi tiáº¿t: " + JSON.stringify(errData.details);
                      }
                      throw new Error(errMsg);
                    }

                    // 2. Change room status to MAINTENANCE
                    await changeStatus(reportingRoomId!, "MAINTENANCE", `BÃ¡o há»ng: ${description}. ${damageNote}`);

                    // 3. If targetBookingId is present, mark the checkout inspection completed with damage
                    if (targetBookingId) {
                      await fetch("/api/housekeeping/checkout-requests/complete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          bookingId: targetBookingId,
                          roomId: reportingRoomId,
                          hasDamage: true,
                          damageDescription: description,
                          estimatedCharge: totalCharge
                        }),
                      });
                    }

                    // Reset form
                    setReportingRoomId(null);
                    setSelectedDamages([]);
                    setCustomDamageName("");
                    setCustomDamagePrice("");
                    setDamageNote("");
                    setDamageImage(null);
                    setTargetBookingId(null);
                    fetchRooms();
                    alert("BÃ¡o cÃ¡o há»ng hÃ³c & ÄÆ°a phÃ²ng vÃ o diá»‡n báº£o trÃ¬ thÃ nh cÃ´ng!");
                  } catch (err: any) {
                    alert("Lá»—i khi bÃ¡o há»ng: " + err.message);
                  } finally {
                    setIsSubmittingDamage(false);
                  }
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl disabled:opacity-50 text-sm shadow flex items-center justify-center gap-2"
              >
                {isSubmittingDamage ? "Äang xá»­ lÃ½..." : "XÃ¡c nháº­n bÃ¡o há»ng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
