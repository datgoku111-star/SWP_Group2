"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Star, 
  X, 
  MapPin, 
  Bed, 
  Users, 
  Layers, 
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";
import ButtonPrimary from "@/shared/ButtonPrimary";
import ButtonThird from "@/shared/ButtonThird";
import Input from "@/shared/Input";

interface Room {
  id: string;
  title: string;
  location: string;
  price_per_night: number;
  image_url: string;
  beds: number;
  guests: number;
  rating: number;
  available_rooms: number;
  created_at?: string;
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States của Modal
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // States của Form nhập liệu
  const [formTitle, setFormTitle] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formPrice, setFormPrice] = useState(100);
  const [formBeds, setFormBeds] = useState(2);
  const [formGuests, setFormGuests] = useState(4);
  const [formRating, setFormRating] = useState(4.5);
  const [formAvailableRooms, setFormAvailableRooms] = useState(5);
  const [formImageUrl, setFormImageUrl] = useState("");
  
  // States tải lên ảnh
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState("");

  // Dữ liệu mẫu (Fallback data) để giao diện hiển thị ngay lập tức
  const fallbackRooms: Room[] = [
    {
      id: "mock-1",
      title: "Best Western Cedars Hotel",
      location: "1 Anzinger Court",
      price_per_night: 26,
      image_url: "https://images.pexels.com/photos/5191371/pexels-photo-5191371.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
      beds: 10,
      guests: 6,
      rating: 4.8,
      available_rooms: 5
    },
    {
      id: "mock-2",
      title: "Bell by Greene King Inns",
      location: "32923 Judy Hill",
      price_per_night: 250,
      image_url: "https://images.pexels.com/photos/3201735/pexels-photo-3201735.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
      beds: 6,
      guests: 4,
      rating: 4.4,
      available_rooms: 3
    },
    {
      id: "mock-3",
      title: "Half Moon, Sherborne by Marston's Inns",
      location: "6731 Killdeer Park",
      price_per_night: 278,
      image_url: "https://images.pexels.com/photos/6434634/pexels-photo-6434634.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
      beds: 9,
      guests: 5,
      rating: 3.6,
      available_rooms: 2
    },
    {
      id: "mock-4",
      title: "White Horse Hotel by Greene King Inns",
      location: "35 Sherman Park",
      price_per_night: 40,
      image_url: "https://images.pexels.com/photos/2506988/pexels-photo-2506988.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
      beds: 7,
      guests: 6,
      rating: 4.8,
      available_rooms: 4
    },
    {
      id: "mock-5",
      title: "Ship and Castle Hotel",
      location: "3 Crest Line Park",
      price_per_night: 147,
      image_url: "https://images.pexels.com/photos/261327/pexels-photo-261327.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
      beds: 3,
      guests: 8,
      rating: 3.4,
      available_rooms: 5
    },
    {
      id: "mock-6",
      title: "The Windmill Family & Commercial Hotel",
      location: "55974 Waxwing Junction",
      price_per_night: 90,
      image_url: "https://images.pexels.com/photos/2373201/pexels-photo-2373201.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
      beds: 7,
      guests: 8,
      rating: 3.8,
      available_rooms: 6
    },
    {
      id: "mock-7",
      title: "Unicorn, Gunthorpe by Marston's Inns",
      location: "79361 Chinook Place",
      price_per_night: 282,
      image_url: "https://images.pexels.com/photos/3068519/pexels-photo-3068519.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
      beds: 2,
      guests: 9,
      rating: 3.0,
      available_rooms: 3
    },
    {
      id: "mock-8",
      title: "Holiday Inn Express Ramsgate Minster, an IHG Hotel",
      location: "6 Chive Avenue",
      price_per_night: 79,
      image_url: "https://images.pexels.com/photos/2343466/pexels-photo-2343466.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260",
      beds: 7,
      guests: 6,
      rating: 3.9,
      available_rooms: 4
    }
  ];

  // Tải danh sách phòng từ bảng hotel_rooms trong Supabase
  const fetchRooms = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabaseBrowser
        .from("hotel_rooms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setRooms(data);
      } else {
        setRooms(fallbackRooms);
      }
    } catch (err: any) {
      console.warn("Lỗi fetch rooms, hiển thị dữ liệu demo:", err.message);
      setErrorMsg("Không thể tải dữ liệu từ Supabase. Đang hiển thị dữ liệu demo.");
      setRooms(fallbackRooms);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Mở Modal Thêm phòng mới
  const handleOpenAddModal = () => {
    setEditingRoom(null);
    setFormTitle("");
    setFormLocation("");
    setFormPrice(50);
    setFormBeds(2);
    setFormGuests(4);
    setFormRating(4.5);
    setFormAvailableRooms(5);
    setFormImageUrl("");
    setImageFile(null);
    setFormError("");
    setIsOpenModal(true);
  };

  // Mở Modal Chỉnh sửa phòng
  const handleOpenEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormTitle(room.title);
    setFormLocation(room.location);
    setFormPrice(room.price_per_night);
    setFormBeds(room.beds);
    setFormGuests(room.guests);
    setFormRating(room.rating);
    setFormAvailableRooms(room.available_rooms);
    setFormImageUrl(room.image_url);
    setImageFile(null);
    setFormError("");
    setIsOpenModal(true);
  };

  // Thực hiện upload ảnh lên Supabase Storage và trả về link Public URL
  const uploadImageToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `rooms/${fileName}`;

    // Upload file lên bucket 'room-images'
    const { error: uploadError } = await supabaseBrowser
      .storage
      .from("room-images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Lấy link ảnh công khai
    const { data } = supabaseBrowser
      .storage
      .from("room-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Xử lý Lưu dữ liệu (Thêm hoặc Sửa)
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    if (!formTitle.trim() || !formLocation.trim()) {
      setFormError("Vui lòng điền đầy đủ Tên phòng và Địa chỉ.");
      return;
    }

    setUploadingImage(true);

    try {
      let finalImageUrl = formImageUrl;

      // Nếu có chọn tệp tin ảnh mới, thực hiện upload trước
      if (imageFile) {
        try {
          finalImageUrl = await uploadImageToStorage(imageFile);
        } catch (uploadErr: any) {
          throw new Error("Lỗi tải ảnh lên Storage: " + uploadErr.message);
        }
      }

      if (!finalImageUrl) {
        throw new Error("Vui lòng chọn ảnh phòng hoặc cung cấp link ảnh.");
      }

      const roomData = {
        title: formTitle,
        location: formLocation,
        price_per_night: Number(formPrice),
        image_url: finalImageUrl,
        beds: Number(formBeds),
        guests: Number(formGuests),
        rating: Number(formRating),
        available_rooms: Number(formAvailableRooms),
      };

      if (editingRoom) {
        // Luồng chỉnh sửa (Update)
        if (editingRoom.id.startsWith("mock-")) {
          setRooms(prev => prev.map(r => r.id === editingRoom.id ? { ...r, ...roomData } : r));
        } else {
          const { error } = await supabaseBrowser
            .from("hotel_rooms")
            .update(roomData)
            .eq("id", editingRoom.id);

          if (error) throw error;
          await fetchRooms();
        }
      } else {
        // Luồng tạo mới (Create)
        if (rooms.some(r => r.id.startsWith("mock-"))) {
          const newMockRoom: Room = {
            id: "mock-" + Math.random().toString(36).substring(2, 9),
            ...roomData
          };
          setRooms(prev => [newMockRoom, ...prev]);
        } else {
          const { error } = await supabaseBrowser
            .from("hotel_rooms")
            .insert([roomData]);

          if (error) throw error;
          await fetchRooms();
        }
      }

      setIsOpenModal(false);
    } catch (err: any) {
      console.error("Lỗi khi lưu phòng:", err);
      setFormError(err.message || "Đã xảy ra lỗi trong quá trình lưu dữ liệu.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Xóa phòng
  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phòng này không? Hành động này không thể hoàn tác.")) return;

    try {
      if (id.startsWith("mock-")) {
        setRooms(prev => prev.filter(r => r.id !== id));
      } else {
        const { error } = await supabaseBrowser
          .from("hotel_rooms")
          .delete()
          .eq("id", id);

        if (error) throw error;
        await fetchRooms();
      }
    } catch (err: any) {
      alert("Lỗi khi xóa phòng: " + err.message);
    }
  };

  // Lọc tìm kiếm theo Tên phòng hoặc Địa chỉ
  const filteredRooms = rooms.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-neutral-50/50 dark:bg-neutral-900/40 min-h-screen">
      
      {/* Tiêu đề & Nút Thêm mới */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center space-x-3">
            <Layers className="w-8 h-8 text-primary-600" />
            <span>Quản Lý Danh Sách Phòng</span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1.5 text-sm">
            CRUD phòng khách sạn, đồng bộ hình ảnh qua Supabase Storage và hiển thị trực tiếp lên trang chủ.
          </p>
        </div>
        <ButtonPrimary onClick={handleOpenAddModal} className="flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Thêm Phòng Mới</span>
        </ButtonPrimary>
      </div>

      {/* Cảnh báo lỗi kết nối DB */}
      {errorMsg && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-2xl flex items-center space-x-3 text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <span>{errorMsg}</span>
          <button 
            onClick={fetchRooms} 
            className="ml-auto underline flex items-center space-x-1 hover:text-amber-950 font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* Tìm kiếm */}
      <div className="flex bg-white dark:bg-neutral-800 p-4 rounded-2xl shadow-sm border border-neutral-200/80 dark:border-neutral-700 items-center justify-between">
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên phòng, khách sạn hoặc địa chỉ..."
            className="block w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-750 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900 dark:text-white font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Bảng danh sách phòng */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700 text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/40 text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4.5 w-16 text-center">STT</th>
                <th scope="col" className="px-6 py-4.5">Ảnh phòng</th>
                <th scope="col" className="px-6 py-4.5">Tên phòng / Khách sạn</th>
                <th scope="col" className="px-6 py-4.5">Địa chỉ</th>
                <th scope="col" className="px-6 py-4.5">Giá / Đêm</th>
                <th scope="col" className="px-6 py-4.5 text-center">Tiện ích (Giường/Khách)</th>
                <th scope="col" className="px-6 py-4.5 text-center">Đánh giá</th>
                <th scope="col" className="px-6 py-4.5 text-center">Còn lại</th>
                <th scope="col" className="px-6 py-4.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {loading ? (
                // Trạng thái đang tải
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4.5"><div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-6 mx-auto"></div></td>
                    <td className="px-6 py-4.5"><div className="w-14 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div></td>
                    <td className="px-6 py-4.5"><div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-36"></div></td>
                    <td className="px-6 py-4.5"><div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-28"></div></td>
                    <td className="px-6 py-4.5"><div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-16"></div></td>
                    <td className="px-6 py-4.5"><div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20 mx-auto"></div></td>
                    <td className="px-6 py-4.5"><div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-10 mx-auto"></div></td>
                    <td className="px-6 py-4.5"><div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full w-16 mx-auto"></div></td>
                    <td className="px-6 py-4.5"><div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg w-20 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-neutral-500 dark:text-neutral-400 font-medium">
                    Không tìm thấy phòng nào phù hợp trong hệ thống.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room, index) => (
                  <tr key={room.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/10 transition-colors">
                    {/* STT */}
                    <td className="px-6 py-4 text-center text-neutral-500 dark:text-neutral-400 font-semibold">
                      {index + 1}
                    </td>

                    {/* Ảnh bìa */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img 
                        src={room.image_url} 
                        alt={room.title} 
                        className="w-14 h-10 object-cover rounded-lg border border-neutral-200/50 dark:border-neutral-700 shadow-sm"
                        onError={(e) => {
                          // Fallback ảnh lỗi
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200";
                        }}
                      />
                    </td>

                    {/* Tên phòng */}
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-neutral-900 dark:text-white">
                      {room.title}
                    </td>

                    {/* Địa chỉ */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-neutral-500 dark:text-neutral-400 space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-450" />
                        <span>{room.location}</span>
                      </div>
                    </td>

                    {/* Giá tiền */}
                    <td className="px-6 py-4 whitespace-nowrap font-extrabold text-neutral-900 dark:text-white">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(room.price_per_night)}
                      <span className="text-[10px] text-neutral-400 font-normal"> /đêm</span>
                    </td>

                    {/* Tiện ích */}
                    <td className="px-6 py-4 text-center whitespace-nowrap text-neutral-600 dark:text-neutral-300 font-semibold">
                      <div className="flex items-center justify-center space-x-3">
                        <span className="flex items-center space-x-1">
                          <Bed className="w-3.5 h-3.5 text-neutral-450" />
                          <span>{room.beds} giường</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5 text-neutral-450" />
                          <span>{room.guests} khách</span>
                        </span>
                      </div>
                    </td>

                    {/* Số sao đánh giá */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center text-yellow-500 font-bold space-x-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-500" />
                        <span>{room.rating}</span>
                      </div>
                    </td>

                    {/* Số phòng trống */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-extrabold ${
                        room.available_rooms <= 2 
                          ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900" 
                          : "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                      }`}>
                        Còn {room.available_rooms} phòng
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(room)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Sửa phòng này"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Xóa phòng này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal Form */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-150 dark:border-neutral-700">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {editingRoom ? "Chỉnh Sửa Thông Tin Phòng" : "Thêm Phòng Khách Sạn Mới"}
              </h3>
              <button 
                onClick={() => setIsOpenModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveRoom} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-155">
                  {formError}
                </div>
              )}

              {/* Tên phòng */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-350">
                  Tên Phòng / Khách sạn <span className="text-red-500">*</span>
                </label>
                <Input 
                  type="text" 
                  value={formTitle} 
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Best Western Cedars Hotel..."
                  required
                />
              </div>

              {/* Địa chỉ */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-350">
                  Địa Chỉ Khu Vực <span className="text-red-500">*</span>
                </label>
                <Input 
                  type="text" 
                  value={formLocation} 
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Ví dụ: 1 Anzinger Court..."
                  required
                />
              </div>

              {/* Hàng: Giá tiền, Giường, Số Khách */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-350">
                    Giá / Đêm ($) <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    type="number" 
                    value={formPrice} 
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    min={0}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-350">
                    Số Giường <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    type="number" 
                    value={formBeds} 
                    onChange={(e) => setFormBeds(Number(e.target.value))}
                    min={1}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-350">
                    Số Khách Max <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    type="number" 
                    value={formGuests} 
                    onChange={(e) => setFormGuests(Number(e.target.value))}
                    min={1}
                    required
                  />
                </div>
              </div>

              {/* Hàng: Đánh giá sao, Số phòng trống */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-350">
                    Đánh Giá Sao (1.0 - 5.0) <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    type="number" 
                    value={formRating} 
                    onChange={(e) => setFormRating(Number(e.target.value))}
                    min={1}
                    max={5}
                    step={0.1}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-350">
                    Số Phòng Trống <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    type="number" 
                    value={formAvailableRooms} 
                    onChange={(e) => setFormAvailableRooms(Number(e.target.value))}
                    min={0}
                    required
                  />
                </div>
              </div>

              {/* Upload Hình ảnh */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-350 block">
                  Hình Ảnh Minh Họa <span className="text-red-500">*</span>
                </label>
                
                {/* Chọn File ảnh máy tính */}
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-neutral-300 border-dashed rounded-2xl cursor-pointer bg-neutral-50 dark:hover:bg-neutral-800 dark:bg-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 transition-colors p-4">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 text-neutral-400 mb-2" />
                      <p className="text-xs text-neutral-500 dark:text-neutral-450 font-semibold text-center">
                        {imageFile ? `Đã chọn: ${imageFile.name}` : "Nhấp để tải ảnh lên Supabase Storage"}
                      </p>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                        PNG, JPG, JPEG (Tối đa 5MB)
                      </p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                          setFormImageUrl(URL.createObjectURL(e.target.files[0])); // Preview tạm thời
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Hoặc Nhập URL ảnh */}
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block text-center uppercase font-bold">Hoặc</span>
                  <Input 
                    type="url" 
                    value={formImageUrl.startsWith("blob:") ? "" : formImageUrl} 
                    onChange={(e) => {
                      setFormImageUrl(e.target.value);
                      setImageFile(null);
                    }}
                    placeholder="Nhập đường dẫn URL ảnh trực tiếp..."
                  />
                </div>

                {/* Preview ảnh hiện tại */}
                {formImageUrl && (
                  <div className="relative mt-2 rounded-xl overflow-hidden border border-neutral-200/50 dark:border-neutral-700 h-32 w-full">
                    <img 
                      src={formImageUrl} 
                      alt="Room Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormImageUrl("");
                        setImageFile(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
                      title="Gỡ ảnh"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-100 dark:border-neutral-700 mt-6">
                <ButtonThird type="button" onClick={() => setIsOpenModal(false)} disabled={uploadingImage}>
                  Hủy bỏ
                </ButtonThird>
                <ButtonPrimary type="submit" disabled={uploadingImage} className="flex items-center space-x-2">
                  {uploadingImage && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingRoom ? "Cập Nhật" : "Lưu Lại"}</span>
                </ButtonPrimary>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
