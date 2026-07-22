"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import DashboardLayout from "../dashboard/layout";
import { Route } from "@/routers/types";

export default function ExperienceSchedulePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?callbackUrl=/experience-schedule" as Route);
      return;
    }

    if (user) {
      fetchExperiences();
    }
  }, [user, isLoading, router]);

  const fetchExperiences = async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        const confirmedExps = data.filter((b: any) => {
          if (b.status !== "CONFIRMED") return false;
          try {
            const parsed = JSON.parse(b.special_requests);
            return parsed && parsed.isExperience === true;
          } catch (e) {
            return false;
          }
        });
        setExperiences(confirmedExps);
      }
    } catch (err) {
      console.error("Failed to fetch experiences", err);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) return <DashboardLayout><div className="p-8">Đang tải lịch trình...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Lịch trình trải nghiệm</h2>
        <p className="text-neutral-500">
          Danh sách các trải nghiệm du lịch của bạn đã được Lễ Tân xác nhận.
        </p>
        
        {experiences.length === 0 ? (
          <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-800 rounded-xl">
            <p className="text-neutral-500">Bạn chưa có lịch trình trải nghiệm nào được xác nhận.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {experiences.map((exp) => {
              let title = "Trải nghiệm";
              let roomNumber = exp.room?.room_number || exp.room_id;
              try {
                const parsed = JSON.parse(exp.special_requests);
                title = parsed.title || title;
                roomNumber = parsed.room_id || roomNumber;
              } catch(e) {}
              
              return (
                <div key={exp.id} className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-emerald-600">{title}</h3>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      Đã xác nhận
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <p><strong>Ngày bắt đầu:</strong> {new Date(exp.check_in_date).toLocaleDateString()}</p>
                    <p><strong>Ngày kết thúc:</strong> {new Date(exp.check_out_date).toLocaleDateString()}</p>
                    <p><strong>Liên kết với phòng:</strong> {roomNumber}</p>
                    <p><strong>Trạng thái thanh toán:</strong> Đã thanh toán toàn bộ ({(exp.total_amount || 0).toLocaleString()} VND)</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
