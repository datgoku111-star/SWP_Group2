"use client";

import React, { useState, useEffect } from "react";
import { BedDouble, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, RefreshCw, Layers, DollarSign, Tag, Wrench, Sparkles, Home } from "lucide-react";
import ButtonPrimary from "@/shared/ButtonPrimary";
import ButtonThird from "@/shared/ButtonThird";
import Input from "@/shared/Input";

export interface RoomTypeData {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  max_occupancy: number;
  amenities: string[];
  images: string[];
}

export interface RoomData {
  id: string;
  room_number: string;
  floor: number;
  room_type_id: string;
  status: "AVAILABLE" | "IN_USE" | "DIRTY" | "MAINTENANCE";
  notes?: string;
  room_type?: RoomTypeData;
}

export default function AdminRoomsPage() {
  const [activeTab, setActiveTab] = useState<"ROOMS" | "TYPES">("ROOMS");
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Room
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);
  const [roomForm, setRoomForm] = useState({
    room_number: "",
    floor: 1,
    room_type_id: "",
    status: "AVAILABLE" as RoomData["status"],
    notes: "",
  });

  // Modal Room Type
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomTypeData | null>(null);
  const [typeForm, setTypeForm] = useState({
    name: "",
    description: "",
    base_price: 1500000,
    max_occupancy: 2,
    amenitiesInput: "Wifi, Smart TV, Mini Bar, Điều Hòa, Ban Công",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, typesRes] = await Promise.all([
        fetch("/api/rooms?all=true"),
        fetch("/api/room-types"),
      ]);

      let loadedTypes: RoomTypeData[] = [];
      if (typesRes.ok) {
        const tData = await typesRes.json();
        if (Array.isArray(tData) && tData.length > 0) loadedTypes = tData;
      }
      if (loadedTypes.length === 0) {
        loadedTypes = [
          { id: "rt-1", name: "Deluxe Ocean View", description: "Phòng hướng biển ban công riêng sang trọng", base_price: 1500000, max_occupancy: 2, amenities: ["Wifi", "Smart TV", "Mini Bar"], images: [] },
          { id: "rt-2", name: "Suite Premium King", description: "Hạng phòng cao cấp với phòng khách riêng biệt", base_price: 2800000, max_occupancy: 4, amenities: ["Wifi", "Smart TV", "Bồn tắm Jacuzzi"], images: [] },
          { id: "rt-3", name: "Standard Garden", description: "Phòng tiêu chuẩn ấm cúng hướng vườn hoa", base_price: 950000, max_occupancy: 2, amenities: ["Wifi", "Điều Hòa"], images: [] },
        ];
      }
      setRoomTypes(loadedTypes);

      let loadedRooms: RoomData[] = [];
      if (roomsRes.ok) {
        const rData = await roomsRes.json();
        if (Array.isArray(rData) && rData.length > 0) loadedRooms = rData;
      }
      if (loadedRooms.length === 0) {
        loadedRooms = [
          { id: "rm-101", room_number: "P101", floor: 1, room_type_id: loadedTypes[0].id, status: "AVAILABLE", room_type: loadedTypes[0] },
          { id: "rm-102", room_number: "P102", floor: 1, room_type_id: loadedTypes[2].id, status: "AVAILABLE", room_type: loadedTypes[2] },
          { id: "rm-201", room_number: "P201", floor: 2, room_type_id: loadedTypes[1].id, status: "IN_USE", room_type: loadedTypes[1] },
          { id: "rm-202", room_number: "P202", floor: 2, room_type_id: loadedTypes[0].id, status: "DIRTY", notes: "Khách vừa trả lúc 12h", room_type: loadedTypes[0] },
          { id: "rm-301", room_number: "VIP_01", floor: 3, room_type_id: loadedTypes[1].id, status: "MAINTENANCE", notes: "Sửa chữa điều hòa", room_type: loadedTypes[1] },
        ];
      }
      setRooms(loadedRooms);
    } catch (err) {
      console.error("Fetch rooms/types error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Room Form Handlers
  const openAddRoom = () => {
    setEditingRoom(null);
    setRoomForm({
      room_number: "",
      floor: 1,
      room_type_id: roomTypes[0]?.id || "",
      status: "AVAILABLE",
      notes: "",
    });
    setIsRoomModalOpen(true);
  };

  const openEditRoom = (room: RoomData) => {
    setEditingRoom(room);
    setRoomForm({
      room_number: room.room_number,
      floor: room.floor,
      room_type_id: room.room_type_id || roomTypes[0]?.id || "",
      status: room.status,
      notes: room.notes || "",
    });
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.room_number.trim() || !roomForm.room_type_id) {
      alert("Vui lòng nhập số phòng và chọn hạng phòng!");
      return;
    }

    try {
      const selectedType = roomTypes.find((t) => t.id === roomForm.room_type_id);
      if (editingRoom) {
        if (editingRoom.id.startsWith("rm-")) {
          setRooms((prev) =>
            prev.map((r) => (r.id === editingRoom.id ? { ...r, ...roomForm, room_type: selectedType } : r))
          );
        } else {
          const res = await fetch("/api/rooms", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingRoom.id, ...roomForm }),
          });
          if (!res.ok) throw new Error("Lỗi cập nhật phòng");
          await fetchData();
        }
      } else {
        const res = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roomForm),
        });
        if (!res.ok) {
          const newRm: RoomData = {
            id: "rm-" + Math.random().toString(36).substring(2, 9),
            ...roomForm,
            room_type: selectedType,
          };
          setRooms((prev) => [newRm, ...prev]);
        } else {
          await fetchData();
        }
      }
      setIsRoomModalOpen(false);
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phòng này?")) return;
    try {
      if (id.startsWith("rm-")) {
        setRooms((prev) => prev.filter((r) => r.id !== id));
      } else {
        const res = await fetch(`/api/rooms?id=${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Không thể xóa phòng");
        setRooms((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err: any) {
      alert("Lỗi xóa phòng: " + err.message);
    }
  };

  // Room Type Form Handlers
  const openAddType = () => {
    setEditingType(null);
    setTypeForm({
      name: "",
      description: "",
      base_price: 1500000,
      max_occupancy: 2,
      amenitiesInput: "Wifi, Smart TV, Mini Bar, Điều Hòa",
    });
    setIsTypeModalOpen(true);
  };

  const openEditType = (type: RoomTypeData) => {
    setEditingType(type);
    setTypeForm({
      name: type.name,
      description: type.description || "",
      base_price: type.base_price,
      max_occupancy: type.max_occupancy,
      amenitiesInput: (type.amenities || []).join(", "),
    });
    setIsTypeModalOpen(true);
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.name.trim() || typeForm.base_price <= 0) {
      alert("Vui lòng nhập tên hạng phòng và giá hợp lệ!");
      return;
    }

    const amenities = typeForm.amenitiesInput.split(",").map((a) => a.trim()).filter(Boolean);

    try {
      if (editingType) {
        if (editingType.id.startsWith("rt-")) {
          setRoomTypes((prev) =>
            prev.map((t) => (t.id === editingType.id ? { ...t, ...typeForm, amenities } : t))
          );
        } else {
          const res = await fetch("/api/room-types", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingType.id, ...typeForm, amenities }),
          });
          if (!res.ok) throw new Error("Lỗi cập nhật hạng phòng");
          await fetchData();
        }
      } else {
        const res = await fetch("/api/room-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...typeForm, amenities }),
        });
        if (!res.ok) {
          const newType: RoomTypeData = {
            id: "rt-" + Math.random().toString(36).substring(2, 9),
            ...typeForm,
            amenities,
            images: [],
          };
          setRoomTypes((prev) => [newType, ...prev]);
        } else {
          await fetchData();
        }
      }
      setIsTypeModalOpen(false);
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa hạng phòng này?")) return;
    try {
      if (id.startsWith("rt-")) {
        setRoomTypes((prev) => prev.filter((t) => t.id !== id));
      } else {
        const res = await fetch(`/api/room-types?id=${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Không thể xóa hạng phòng");
        setRoomTypes((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err: any) {
      alert("Lỗi xóa hạng phòng: " + err.message);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-neutral-50 dark:bg-neutral-900 min-h-screen rounded-2xl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-3">
            <BedDouble className="w-8 h-8 text-primary-600" />
            Quản Trị Buồng Phòng & Định Giá Hạng Phòng
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Thiết lập danh sách số phòng thực tế, tầng lầu và cấu hình đơn giá theo từng hạng phòng (Deluxe, Suite...).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ButtonThird onClick={fetchData} sizeClass="px-4 py-2.5">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </ButtonThird>
          {activeTab === "ROOMS" ? (
            <ButtonPrimary onClick={openAddRoom} sizeClass="px-5 py-2.5">
              <Plus className="w-5 h-5 mr-1.5" />
              Thêm Phòng Thực Tế
            </ButtonPrimary>
          ) : (
            <ButtonPrimary onClick={openAddType} sizeClass="px-5 py-2.5">
              <Plus className="w-5 h-5 mr-1.5" />
              Tạo Hạng Phòng Mới
            </ButtonPrimary>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-700 pb-3">
        <button
          onClick={() => setActiveTab("ROOMS")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
            activeTab === "ROOMS"
              ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
              : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100"
          }`}
        >
          <Home className="w-4 h-4" />
          🛏️ Danh Sách Buồng Phòng Thực Tế ({rooms.length})
        </button>
        <button
          onClick={() => setActiveTab("TYPES")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
            activeTab === "TYPES"
              ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
              : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100"
          }`}
        >
          <Tag className="w-4 h-4" />
          💎 Hạng Phòng & Bảng Giá (`base_price`) ({roomTypes.length})
        </button>
      </div>

      {/* TAB 1: ROOMS INVENTORY TABLE */}
      {activeTab === "ROOMS" && (
        <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-neutral-500">Đang tải danh sách phòng...</div>
          ) : rooms.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">Chưa có phòng nào. Hãy nhấn "Thêm Phòng Thực Tế"!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-300 font-semibold text-sm">
                    <th className="py-4 px-6">Số Phòng (`room_number`)</th>
                    <th className="py-4 px-6">Tầng (`floor`)</th>
                    <th className="py-4 px-6">Hạng Phòng (`room_type`)</th>
                    <th className="py-4 px-6">Đơn Giá Cơ Bản</th>
                    <th className="py-4 px-6">Trạng Thái Hiện Tại</th>
                    <th className="py-4 px-6 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/60 text-sm">
                  {rooms.map((room) => {
                    const statusColors = {
                      AVAILABLE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
                      IN_USE: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
                      DIRTY: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
                      MAINTENANCE: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
                    };
                    const statusLabels = {
                      AVAILABLE: "✨ Sẵn Sàng (Available)",
                      IN_USE: "🛏️ Đang Ở (In Use)",
                      DIRTY: "🧹 Chưa Dọn (Dirty)",
                      MAINTENANCE: "🔧 Bảo Trì (Maintenance)",
                    };
                    return (
                      <tr key={room.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-700/30 transition-colors">
                        <td className="py-4 px-6 font-extrabold text-neutral-900 dark:text-white text-base">
                          Phòng {room.room_number}
                        </td>
                        <td className="py-4 px-6 font-semibold">Tầng {room.floor}</td>
                        <td className="py-4 px-6 font-bold text-primary-600 dark:text-primary-400">
                          {room.room_type?.name || "Standard"}
                        </td>
                        <td className="py-4 px-6 font-extrabold text-neutral-900 dark:text-white">
                          {(room.room_type?.base_price || 1500000).toLocaleString("vi-VN")} đ/đêm
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1.5 rounded-xl font-bold text-xs ${statusColors[room.status]}`}>
                            {statusLabels[room.status]}
                          </span>
                          {room.notes && <div className="text-xs text-neutral-400 mt-1">📝 {room.notes}</div>}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => openEditRoom(room)}
                            className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROOM TYPES & PRICING TABLE */}
      {activeTab === "TYPES" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomTypes.map((type) => (
            <div key={type.id} className="bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-700 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white">{type.name}</h3>
                  <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 font-bold px-3 py-1 rounded-full text-xs">
                    Max: {type.max_occupancy} Khách
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                  {type.description || "Phòng nghỉ sang trọng với tiện nghi chuẩn quốc tế"}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(type.amenities || []).map((am, i) => (
                    <span key={i} className="bg-neutral-100 dark:bg-neutral-700 px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      ✓ {am}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-400">Đơn giá (`base_price`)</span>
                  <div className="text-2xl font-black text-primary-600 dark:text-primary-400">
                    {type.base_price.toLocaleString("vi-VN")} đ <span className="text-xs font-normal text-neutral-500">/đêm</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => openEditType(type)} className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200">
                    <Edit2 className="w-4 h-4 text-neutral-700 dark:text-neutral-200" />
                  </button>
                  <button onClick={() => handleDeleteType(type.id)} className="p-2 rounded-xl bg-red-50 dark:bg-red-900/30 hover:bg-red-100 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Room */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-neutral-100 dark:border-neutral-700 space-y-6">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              {editingRoom ? "✏️ Cập Nhật Buồng Phòng" : "➕ Thêm Phòng Thực Tế"}
            </h3>

            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Số Phòng (`room_number`) *</label>
                  <Input
                    required
                    placeholder="P101, VIP01..."
                    value={roomForm.room_number}
                    onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Tầng Lầu (`floor`) *</label>
                  <Input
                    required
                    type="number"
                    min={1}
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Hạng Phòng (`room_type`) *</label>
                <select
                  value={roomForm.room_type_id}
                  onChange={(e) => setRoomForm({ ...roomForm, room_type_id: e.target.value })}
                  className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm font-semibold outline-none"
                >
                  {roomTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} — ({t.base_price.toLocaleString("vi-VN")} đ)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Trạng Thái Ban Đầu</label>
                <select
                  value={roomForm.status}
                  onChange={(e: any) => setRoomForm({ ...roomForm, status: e.target.value })}
                  className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm font-semibold outline-none"
                >
                  <option value="AVAILABLE">✨ Sẵn Sàng (AVAILABLE)</option>
                  <option value="IN_USE">🛏️ Đang Ở (IN_USE)</option>
                  <option value="DIRTY">🧹 Chưa Dọn (DIRTY)</option>
                  <option value="MAINTENANCE">🔧 Bảo Trì (MAINTENANCE)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Ghi Chú</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm nếu cần..."
                  value={roomForm.notes}
                  onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
                  className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                <ButtonThird type="button" onClick={() => setIsRoomModalOpen(false)}>Hủy</ButtonThird>
                <ButtonPrimary type="submit">Lưu Phòng</ButtonPrimary>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Room Type */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-neutral-100 dark:border-neutral-700 space-y-6">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              {editingType ? "✏️ Cập Nhật Hạng Phòng" : "➕ Tạo Hạng Phòng Mới"}
            </h3>

            <form onSubmit={handleSaveType} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Tên Hạng Phòng (`name`) *</label>
                <Input
                  required
                  placeholder="Deluxe Ocean, Suite Premium King..."
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Đơn Giá / Đêm (VNĐ) *</label>
                  <Input
                    required
                    type="number"
                    min={100000}
                    step={50000}
                    value={typeForm.base_price}
                    onChange={(e) => setTypeForm({ ...typeForm, base_price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Sức Chứa Tối Đa *</label>
                  <Input
                    required
                    type="number"
                    min={1}
                    max={15}
                    value={typeForm.max_occupancy}
                    onChange={(e) => setTypeForm({ ...typeForm, max_occupancy: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Tiện Nghi (Cách nhau bởi dấu phẩy) *</label>
                <Input
                  required
                  placeholder="Wifi, Smart TV, Mini Bar, Bồn tắm..."
                  value={typeForm.amenitiesInput}
                  onChange={(e) => setTypeForm({ ...typeForm, amenitiesInput: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Mô Tả Hạng Phòng</label>
                <textarea
                  rows={2}
                  value={typeForm.description}
                  onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                  className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                <ButtonThird type="button" onClick={() => setIsTypeModalOpen(false)}>Hủy</ButtonThird>
                <ButtonPrimary type="submit">Lưu Hạng Phòng</ButtonPrimary>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
