"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RoomType {
  id: string;
  name: string;
  rooms: { id: string; roomNumber: string; status: string }[];
}

export default function NewBookingPage() {
  const router = useRouter();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    guestName: "",
    roomTypeId: "",
    roomId: "",
    checkIn: "",
    checkOut: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/rooms")
      .then((r) => r.json())
      .then((data) => setRoomTypes(data));
  }, []);

  const selectedRoomType = roomTypes.find((rt) => rt.id === form.roomTypeId);
  const availableRooms = selectedRoomType?.rooms.filter((r) => r.status === "AVAILABLE") || [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const checkIn = new Date(form.checkIn);
    const checkOut = new Date(form.checkOut);
    if (checkOut <= checkIn) {
      alert("离店日期必须晚于入住日期");
      return;
    }
    if (!form.roomId) {
      alert("请选择房间");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        guestName: form.guestName,
        roomTypeId: form.roomTypeId,
        roomId: form.roomId,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        notes: form.notes || null,
        status: "CONFIRMED",
      };
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "创建失败");
        return;
      }
      router.push("/bookings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">新建预订</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">客人姓名 *</label>
          <input
            type="text"
            value={form.guestName}
            onChange={(e) => setForm({ ...form, guestName: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">房型 *</label>
          <select
            value={form.roomTypeId}
            onChange={(e) => setForm({ ...form, roomTypeId: e.target.value, roomId: "" })}
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            <option value="">请选择房型</option>
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </select>
        </div>

        {form.roomTypeId && (
          <div>
            <label className="block text-sm font-medium mb-1">
              分配房间
              {availableRooms.length === 0 && (
                <span className="text-red-400 font-normal ml-2 text-xs">该房型暂无空闲房间</span>
              )}
            </label>
            <select
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">请选择房间</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roomNumber}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">入住日期 *</label>
            <input
              type="date"
              value={form.checkIn}
              onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">离店日期 *</label>
            <input
              type="date"
              value={form.checkOut}
              onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">备注</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 h-20"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "创建中..." : "确认预订"}
          </button>
        </div>
      </form>
    </div>
  );
}
