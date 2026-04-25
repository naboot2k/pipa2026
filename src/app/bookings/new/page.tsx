"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { calcTotalPrice } from "@/lib/utils";

interface RoomType {
  id: string;
  name: string;
  price: number;
  weekendPrice: number | null;
}

export default function NewBookingPage() {
  const router = useRouter();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [form, setForm] = useState({
    guestName: "",
    guestPhone: "",
    guestIdCard: "",
    roomTypeId: "",
    checkIn: "",
    checkOut: "",
    adults: "1",
    children: "0",
    notes: "",
    deposit: "0",
  });
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    fetch("/api/rooms")
      .then((r) => r.json())
      .then(setRoomTypes);
  }, []);

  useEffect(() => {
    if (!form.roomTypeId || !form.checkIn || !form.checkOut) {
      setTotalPrice(0);
      return;
    }
    const rt = roomTypes.find((r) => r.id === form.roomTypeId);
    if (rt) {
      setTotalPrice(
        calcTotalPrice(rt.price, rt.weekendPrice, new Date(form.checkIn), new Date(form.checkOut)),
      );
    }
  }, [form.roomTypeId, form.checkIn, form.checkOut, roomTypes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const checkIn = new Date(form.checkIn);
    const checkOut = new Date(form.checkOut);
    if (checkOut <= checkIn) {
      alert("离店日期必须晚于入住日期");
      return;
    }
    if (totalPrice <= 0) {
      alert("总价必须大于0，请检查日期和房型");
      return;
    }
    await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, totalPrice, status: "PENDING" }),
    });
    router.push("/bookings");
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">新建预订</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium mb-1">联系电话 *</label>
            <input
              type="tel"
              value={form.guestPhone}
              onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">身份证号</label>
          <input
            type="text"
            value={form.guestIdCard}
            onChange={(e) => setForm({ ...form, guestIdCard: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">房型 *</label>
          <select
            value={form.roomTypeId}
            onChange={(e) => setForm({ ...form, roomTypeId: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            <option value="">请选择房型</option>
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name} - ¥{rt.price}/晚
              </option>
            ))}
          </select>
        </div>

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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">成人数</label>
            <input
              type="number"
              min="1"
              value={form.adults}
              onChange={(e) => setForm({ ...form, adults: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">儿童数</label>
            <input
              type="number"
              min="0"
              value={form.children}
              onChange={(e) => setForm({ ...form, children: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
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

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">预估总价</span>
            <span className="text-xl font-bold text-blue-600">¥{totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            确认预订
          </button>
        </div>
      </form>
    </div>
  );
}
