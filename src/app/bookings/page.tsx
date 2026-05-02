"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Plus, Eye } from "lucide-react";

interface Booking {
  id: string;
  guestName: string;
  guestPhone: string | null;
  checkIn: string;
  checkOut: string;
  status: string;
  roomType: { name: string };
  room: { roomNumber: string } | null;
}

const statusLabels: Record<string, string> = {
  PENDING: "待确认",
  CONFIRMED: "已确认",
  CHECKED_IN: "已入住",
  CHECKED_OUT: "已退房",
  CANCELLED: "已取消",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  CONFIRMED: "bg-yellow-100 text-yellow-700",
  CHECKED_IN: "bg-blue-100 text-blue-700",
  CHECKED_OUT: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchBookings();
  }, [filterStatus]);

  async function fetchBookings() {
    const url = filterStatus ? `/api/bookings?status=${filterStatus}` : "/api/bookings";
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    setBookings(data);
  }

  async function handleCancel(id: string) {
    if (!confirm("确定取消此预订？")) return;
    await fetch(`/api/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    fetchBookings();
  }

  async function handleConfirm(id: string) {
    await fetch(`/api/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });
    fetchBookings();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">预订管理</h2>
        <Link href="/bookings/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          新建预订
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center gap-3 p-4 border-b">
          <span className="text-sm text-gray-500">状态筛选：</span>
          <button
            onClick={() => setFilterStatus("")}
            className={`px-3 py-1 rounded-full text-sm ${!filterStatus ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            全部
          </button>
          {Object.entries(statusLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1 rounded-full text-sm ${filterStatus === key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {bookings.length === 0 ? (
          <p className="p-8 text-center text-gray-400">暂无预订</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">客人</th>
                <th className="text-left p-3">房型</th>
                <th className="text-left p-3">房间</th>
                <th className="text-left p-3">入住日期</th>
                <th className="text-left p-3">离店日期</th>
                <th className="text-left p-3">状态</th>
                <th className="text-left p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{b.guestName}</td>
                  <td className="p-3">{b.roomType.name}</td>
                  <td className="p-3">{b.room?.roomNumber || "-"}</td>
                  <td className="p-3">{format(new Date(b.checkIn), "MM-dd")}</td>
                  <td className="p-3">{format(new Date(b.checkOut), "MM-dd")}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[b.status]}`}>
                      {statusLabels[b.status]}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {b.status === "PENDING" && (
                        <button
                          onClick={() => handleConfirm(b.id)}
                          className="px-2 py-0.5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                        >
                          确认
                        </button>
                      )}
                      {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="px-2 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                        >
                          取消
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
