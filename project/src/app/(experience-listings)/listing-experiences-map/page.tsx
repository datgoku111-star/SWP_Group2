"use client";

import React, { FC, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { 
  Calendar, 
  MapPin, 
  Sparkles, 
  Compass, 
  Clock, 
  CheckCircle2, 
  Backpack, 
  ChevronRight,
  ArrowRight,
  AlertTriangle,
  Loader2
} from "lucide-react";

export interface ItineraryItem {
  time: string;
  title: string;
  description: string;
}

export interface ExperienceDetails {
  gatheringTime: string;
  gatheringLocation: string;
  accessories: string[];
  endingLocation: string;
  timeline: ItineraryItem[];
}

export interface BookedExperience {
  bookingId: string;
  title: string;
  category: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
}

const ITINERARY_MAPS: Record<string, ExperienceDetails> = {
  climbing: {
    gatheringTime: "07:00 AM",
    gatheringLocation: "Cổng số 1, Vườn Quốc Gia Hoàng Liên Sơn (Sapa, Lào Cai)",
    accessories: [
      "Bản đồ địa hình Sapa chuyên dụng",
      "Gậy leo núi sợi carbon chịu lực",
      "Đèn pin đội đầu siêu sáng kèm pin dự phòng",
      "Bộ sơ cứu cá nhân khẩn cấp",
      "Nước bù điện giải & lương khô năng lượng cao"
    ],
    endingLocation: "Trạm dừng chân Núi Fansipan (Sapa, Lào Cai)",
    timeline: [
      { time: "07:00 - 07:30", title: "Tập trung & Khởi động", description: "Gặp gỡ hướng dẫn viên chuyên nghiệp, kiểm tra trang bị an toàn cá nhân và khởi động làm nóng cơ thể." },
      { time: "07:30 - 11:30", title: "Chinh phục Chặng 1", description: "Bắt đầu leo qua các dốc đá thoai thoải, xuyên qua khu rừng trúc nguyên sinh và vượt suối nhỏ." },
      { time: "11:30 - 12:30", title: "Nghỉ trưa tại Trạm dừng 2000m", description: "Dùng bữa trưa dinh dưỡng với cơm lam bản địa, ngắm nhìn thung lũng Mường Hoa tuyệt đẹp từ trên cao." },
      { time: "12:30 - 15:30", title: "Bứt tốc lên đỉnh núi", description: "Chinh phục các đoạn dốc đứng đá tai mèo đầy thử thách, hỗ trợ nhau bằng gậy leo núi và dây đai hỗ trợ." },
      { time: "15:30 - 16:30", title: "Chạm đỉnh Fansipan & Xuống núi", description: "Chụp ảnh check-in đỉnh núi, nhận huy chương kỷ niệm chặng leo và chuẩn bị di chuyển xuống chân núi bằng hệ thống cáp treo hiện đại." }
    ]
  },
  rowing: {
    gatheringTime: "08:30 AM",
    gatheringLocation: "Bến thuyền du lịch sinh thái Tràng An (Ninh Bình)",
    accessories: [
      "Áo phao cứu hộ tiêu chuẩn quốc tế",
      "Mái chèo đôi sợi thủy tinh siêu nhẹ",
      "Túi chống nước bảo vệ điện thoại & máy ảnh",
      "Kem chống nắng vật lý & kính râm chống tia cực tím",
      "Mũ rộng vành tránh nắng sông nước"
    ],
    endingLocation: "Bến thuyền du lịch sinh thái Tràng An (Ninh Bình)",
    timeline: [
      { time: "08:30 - 09:00", title: "Chuẩn bị xuất bến", description: "Nghe hướng dẫn kỹ thuật chèo xuồng Kayak cơ bản và quy tắc an toàn sông nước, mặc áo phao cứu hộ." },
      { time: "09:00 - 11:30", title: "Khám phá danh thắng Tràng An", description: "Tự tay chèo thuyền xuôi dòng sào khê, luồn lách qua các hang động đá vôi tự nhiên thạch nhũ huyền ảo." },
      { time: "11:30 - 12:30", title: "Ghé thăm Đền cổ ven sông", description: "Neo thuyền nghỉ ngơi, tham quan đền Trần cổ kính linh thiêng nằm cô độc giữa lòng núi đá vôi." },
      { time: "12:30 - 13:30", title: "Chèo ngược dòng & Cập bến", description: "Chèo thong thả ngắm hoàng hôn đổ bóng trên dãy núi đá vôi, cập bến an toàn và bàn giao lại trang thiết bị chèo." }
    ]
  },
  swimming: {
    gatheringTime: "09:00 AM",
    gatheringLocation: "Quầy lễ tân bể bơi vô cực Fis Hotel (Tầng 5 tòa nhà chính)",
    accessories: [
      "Kính bơi quang học chống mờ sương",
      "Khăn tắm bông bông sợi lớn cao cấp",
      "Nút tai chống nước silicon",
      "Đồ uống detox trái cây giải nhiệt sau bơi"
    ],
    endingLocation: "Khu vực thư giãn Sauna & Jacuzzi (Tầng 5)",
    timeline: [
      { time: "09:00 - 09:15", title: "Nhận đồ & Check-in", description: "Khách hàng xuất trình mã QR xác nhận dịch vụ tại quầy, nhận tủ đồ khóa từ thông minh và bộ khăn tắm." },
      { time: "09:15 - 10:30", title: "Trải nghiệm bơi vô cực ngắm thành phố", description: "Tự do bơi lội trong làn nước mát lành, ngắm trọn vẹn view đường chân trời Hà Nội từ bể bơi vô cực trên cao." },
      { time: "10:30 - 11:30", title: "Thư giãn Sauna & Bể sục Jacuzzi", description: "Tận hưởng phòng xông hơi đá muối thải độc và ngâm mình thư giãn trong dòng nước sủi bọt ấm Jacuzzi giúp hồi phục cơ bắp." }
    ]
  },
  skiing: {
    gatheringTime: "08:00 AM",
    gatheringLocation: "Trạm dịch vụ thiết bị trượt tuyết Zone A (Chân núi tuyết)",
    accessories: [
      "Bộ ván trượt tuyết cao cấp (Ski Board & Boots)",
      "Kính bảo hộ tuyết chống lóa và chắn gió",
      "Găng tay chống nước & mũ len trùm đầu giữ ấm",
      "Áo phao phao tuyết giữ nhiệt chuyên nghiệp"
    ],
    endingLocation: "Nhà hàng ẩm thực sưởi ấm Alpine Lounge",
    timeline: [
      { time: "08:00 - 08:45", title: "Thử giày & Nhận trang bị", description: "Đo cỡ chân, chọn ván trượt phù hợp cân nặng chiều cao và nghe hướng dẫn cách cài tháo khóa an toàn." },
      { time: "08:45 - 11:30", title: "Lớp học trượt tuyết cùng HLV", description: "Tập trung tại dốc thoải dành cho người mới bắt đầu, học kỹ thuật phanh chữ V và đổi hướng an toàn cùng huấn luyện viên." },
      { time: "11:30 - 12:30", title: "Dùng bữa trưa ấm áp", description: "Nghỉ ngơi dùng súp nóng và gà nướng sưởi ấm cơ thể tại nhà hàng đỉnh núi tuyết trắng xóa." },
      { time: "12:30 - 15:00", title: "Thử thách dốc trượt tự do", description: "Tự do trải nghiệm các cấp độ đường trượt cao hơn tùy thuộc vào mức độ kiểm soát ván trượt cá nhân." }
    ]
  },
  default: {
    gatheringTime: "08:00 AM",
    gatheringLocation: "Sảnh đón khách chính - Khách sạn Fis Hotel",
    accessories: [
      "Thẻ trải nghiệm dịch vụ VIP",
      "Nước uống tinh khiết đóng chai",
      "Bản đồ chỉ dẫn khu nghỉ dưỡng & cẩm nang du lịch"
    ],
    endingLocation: "Sảnh đón khách chính - Khách sạn Fis Hotel",
    timeline: [
      { time: "08:00 - 08:30", title: "Tập trung & Soát vé", description: "Gặp gỡ Hướng dẫn viên du lịch tại sảnh, làm thủ tục kiểm tra thông tin vé đặt chỗ và nhận cẩm nang." },
      { time: "08:30 - 11:30", title: "Hành trình trải nghiệm dịch vụ", description: "Tham gia các chuỗi hoạt động thú vị, thưởng ngoạn cảnh quan tươi đẹp theo lộ trình hướng dẫn viên dẫn dắt." },
      { time: "11:30 - 13:00", title: "Dùng bữa trưa & Giao lưu", description: "Thưởng thức tiệc trưa đặc sản vùng miền hấp dẫn và cùng tham gia các trò chơi tập thể kết nối mọi người." },
      { time: "13:00 - 15:30", title: "Tham quan & Mua sắm tự do", description: "Dành thời gian tự do tản bộ chụp hình phong cảnh, mua sắm đặc sản làm quà lưu niệm cho bạn bè gia đình." },
      { time: "15:30 - 16:00", title: "Kết thúc hành trình", description: "Xe điện trung chuyển đưa quý khách trở lại điểm tập trung ban đầu tại khách sạn, kết thúc buổi trải nghiệm tốt đẹp." }
    ]
  }
};

const ExperienceItineraryPage: FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [experiences, setExperiences] = useState<BookedExperience[]>([]);
  const [selectedExpIndex, setSelectedExpIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchBookedExperiences = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/bookings");
        if (!res.ok) throw new Error("Không thể kết nối đến hệ thống máy chủ.");
        
        const data = await res.json();
        if (Array.isArray(data)) {
          const validExps: BookedExperience[] = [];
          
          data.forEach((b: any) => {
            // Lọc các đơn hàng trải nghiệm đã thanh toán (CONFIRMED hoặc CHECKED_IN)
            if (b.status === "CONFIRMED" || b.status === "CHECKED_IN") {
              if (b.special_requests) {
                try {
                  const reqObj = JSON.parse(b.special_requests);
                  if (reqObj && reqObj.isExperience === true) {
                    validExps.push({
                      bookingId: b.id,
                      title: reqObj.title || b.room?.room_type?.name || "Trải nghiệm kỳ thú",
                      category: reqObj.category || "Experience",
                      checkInDate: b.check_in_date,
                      checkOutDate: b.check_out_date,
                      totalAmount: Number(b.total_amount)
                    });
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          });

          // Quét các order dịch vụ (service_orders) được thêm bởi lễ tân
          for (const b of data) {
            if (b.status === "CHECKED_IN") {
              try {
                const ordersRes = await fetch(`/api/orders?booking_id=${b.id}`);
                if (ordersRes.ok) {
                  const orders = await ordersRes.json();
                  if (Array.isArray(orders)) {
                    orders.forEach((order: any) => {
                      if (order.status === "IN_PROGRESS" || order.status === "COMPLETED") {
                        order.items?.forEach((item: any) => {
                          const nameLower = (item.service_name || "").toLowerCase();
                          let key = "";
                          if (nameLower.includes("climbing") || nameLower.includes("leo núi")) key = "climbing";
                          else if (nameLower.includes("rowing") || nameLower.includes("chèo thuyền")) key = "rowing";
                          else if (nameLower.includes("swimming") || nameLower.includes("bể bơi") || nameLower.includes("tắm biển")) key = "swimming";
                          else if (nameLower.includes("skiing") || nameLower.includes("trượt tuyết")) key = "skiing";
                          
                          if (key) {
                            validExps.push({
                              bookingId: `${b.id}-service-${item.id}`,
                              title: key,
                              category: "Experience (Counter)",
                              checkInDate: b.check_in_date,
                              checkOutDate: b.check_out_date,
                              totalAmount: Number(item.subtotal || 0)
                            });
                          }
                        });
                      }
                    });
                  }
                }
              } catch (err) {
                console.error("Failed to fetch service orders for booking:", b.id, err);
              }
            }
          }

          setExperiences(validExps);
        }
      } catch (err: any) {
        console.error("Fetch experiences itinerary failed:", err);
        setError("Có lỗi xảy ra khi tải dữ liệu lịch trình của bạn.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookedExperiences();
  }, [user, authLoading]);

  // Render Loading state
  if (authLoading || loading) {
    return (
      <div className="container py-24 flex flex-col items-center justify-center min-h-[450px]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
        <p className="text-neutral-500 text-sm">Đang tải lịch trình trải nghiệm của bạn...</p>
      </div>
    );
  }

  // Render Login required state
  if (!user) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center max-w-xl text-center min-h-[450px]">
        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
          <Compass className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">Bạn chưa đăng nhập</h3>
        <p className="text-neutral-500 mt-2 text-sm max-w-sm">
          Vui lòng đăng nhập tài khoản khách hàng để xem lịch trình các dịch vụ trải nghiệm mà bạn đã đặt mua.
        </p>
        <Link href="/hsrm-login?callbackUrl=/listing-experiences-map" className="mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  // Render No booked experiences -> "Xin hãy đặt dịch vụ"
  if (experiences.length === 0) {
    return (
      <div className="container py-24 flex flex-col items-center justify-center max-w-xl text-center min-h-[450px]">
        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center mb-6 border border-emerald-100 dark:border-emerald-900/40">
          <Compass className="w-10 h-10 text-emerald-600 animate-pulse" />
        </div>
        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">Xin hãy đặt dịch vụ</h3>
        <p className="text-neutral-500 mt-2.5 text-sm max-w-sm leading-relaxed">
          Bạn chưa có lịch trình trải nghiệm nào được kích hoạt. Hãy lựa chọn các hoạt động du lịch lý thú tại khách sạn Fis Hotel để bắt đầu chuyến phiêu lưu của bạn!
        </p>
        <Link href="/listing-experiences" className="mt-8 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center gap-2">
          Khám phá Trải nghiệm
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Active schedule details mapping
  const currentExp = experiences[selectedExpIndex];
  const titleLower = currentExp.title.toLowerCase();
  
  let details = ITINERARY_MAPS.default;
  if (titleLower.includes("climbing") || titleLower.includes("leo núi")) {
    details = ITINERARY_MAPS.climbing;
  } else if (titleLower.includes("rowing") || titleLower.includes("chèo thuyền") || titleLower.includes("row")) {
    details = ITINERARY_MAPS.rowing;
  } else if (titleLower.includes("swimming") || titleLower.includes("bơi")) {
    details = ITINERARY_MAPS.swimming;
  } else if (titleLower.includes("skiing") || titleLower.includes("trượt tuyết")) {
    details = ITINERARY_MAPS.skiing;
  }

  return (
    <div className="container py-16 mb-24 lg:mb-32 max-w-5xl">
      {/* Title Header */}
      <div className="text-center md:text-left border-b border-neutral-200 dark:border-neutral-700 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-emerald-600 text-sm font-bold tracking-wider uppercase flex items-center gap-1.5 justify-center md:justify-start">
            <Sparkles className="w-4 h-4" />
            Lộ trình trải nghiệm cá nhân của bạn
          </span>
          <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white mt-1">
            Lịch Trình Trải Nghiệm Khách Hàng
          </h2>
        </div>

        {/* Dropdown switch if multiple experience bookings exist */}
        {experiences.length > 1 && (
          <div className="flex items-center gap-2 justify-center">
            <label className="text-xs text-neutral-500 font-bold">Chọn dịch vụ khác:</label>
            <select
              value={selectedExpIndex}
              onChange={(e) => setSelectedExpIndex(Number(e.target.value))}
              className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-750 px-3 py-2 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-neutral-700 dark:text-neutral-250 cursor-pointer"
            >
              {experiences.map((exp, idx) => (
                <option key={exp.bookingId} value={idx}>
                  {exp.title} ({exp.checkInDate})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded-xl mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Summary Card & Accessories */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick info card */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-750 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 px-3 py-1 rounded-full uppercase">
                {currentExp.category}
              </span>
              <span className="text-xs text-neutral-400 font-mono">ID: #{currentExp.bookingId.substring(0, 8)}</span>
            </div>
            
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white capitalize">
              {currentExp.title}
            </h3>

            <div className="space-y-3 pt-2 text-sm text-neutral-600 dark:text-neutral-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>Ngày khởi hành: <strong>{currentExp.checkInDate}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>Giờ tập trung: <strong className="text-emerald-600">{details.gatheringTime}</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-neutral-400 block font-semibold">Điểm tập trung xuất phát:</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 leading-tight block">{details.gatheringLocation}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs text-neutral-400 block font-semibold">Điểm tập trung kết thúc:</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 leading-tight block">{details.endingLocation}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Included Accessories */}
          <div className="bg-emerald-50/40 dark:bg-emerald-950/10 rounded-3xl border border-emerald-200/40 dark:border-emerald-900/30 p-6 space-y-4">
            <h4 className="font-bold text-neutral-950 dark:text-white flex items-center gap-2 text-base">
              <Backpack className="w-5 h-5 text-emerald-600" />
              Phụ kiện đi kèm dịch vụ
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              * Quý khách sẽ được ban quản lý / hướng dẫn viên cấp phát các phụ kiện sau tại điểm tập trung trước khi bắt đầu hành trình:
            </p>
            <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              {details.accessories.map((acc, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{acc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Side: Detailed Timeline Itinerary */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-750 p-6 md:p-8 shadow-sm">
          <h3 className="text-xl font-bold text-neutral-950 dark:text-white mb-6 flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600" />
            Lịch trình hoạt động chi tiết
          </h3>
          
          <div className="relative border-l border-neutral-200 dark:border-neutral-800 ml-4 md:ml-6 pl-6 space-y-8">
            {details.timeline.map((item, index) => (
              <div key={index} className="relative">
                {/* Timeline node icon */}
                <span className="absolute -left-[35px] md:-left-[43px] top-0 flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 ring-4 ring-white dark:ring-neutral-900 font-bold text-xs md:text-sm">
                  {index + 1}
                </span>

                {/* Timeline content details */}
                <div className="space-y-1.5 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-800/40 p-4 rounded-2xl hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-bold text-emerald-600 font-mono bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 rounded-lg w-fit">
                      {item.time}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-neutral-900 dark:text-white pt-0.5">
                    {item.title}
                  </h4>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExperienceItineraryPage;
