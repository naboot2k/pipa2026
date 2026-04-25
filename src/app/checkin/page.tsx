"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CheckCircle, LogOut } from "lucide-react";

interface Booking {
  id: string;
  guestName: string;
  guestPhone: string;
  guestIdCard: string | null;
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: number;
  deposit: number;
  roomType: { name: string };
  room: { id: string; roomNumber: string } | null;
}

interface Room {
  id: string;
  roomNumber: string;
  status: string;
  roomType: { id: string; name: string };
}

export default function CheckinPage() {
  const [tab, setTab] = useState<"checkin" | "checkout">("checkin");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [idCard, setIdCard] = useState("");
  const [deposit, setDeposit] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    const res = await fetch("/api/bookings");
    const data = await res.json();
    setBookings(data);

    // Load all rooms with their types
    const roomsRes = await fetch("/api/rooms");
    const roomsData = await roomsRes.json();
    const allRooms: Room[] = [];
    roomsData.forEach((rt: any) => {
      rt.rooms.forEach((room: any) => {
        allRooms.push({ ...room, roomType: { id: rt.id, name: rt.name } });
      });
    });
    setAvailableRooms(allRooms);
  }

  function getPendingCheckins() {
    return bookings.filter((b) => b.status === "CONFIRMED");
  }

  function getActiveCheckins() {
    return bookings.filter((b) => b.status === "CHECKED_IN");
  }

  async function handleCheckIn() {
    if (!selectedBooking || !selectedRoomId || !idCard) {
      alert("请填写完整信息");
      return;
    }
    setProcessing(true);
    try {
      // Update booking
      await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CHECKED_IN",
          roomId: selectedRoomId,
          guestIdCard: idCard,
          deposit: deposit || "0",
        }),
      });
      // Update room status
      await fetch(`/api/rooms/rooms/${selectedRoomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OCCUPIED" }),
      });
      // Record payment: room fee + deposit
      const totalAmount = selectedBooking.totalPrice + (parseFloat(deposit) || 0);
      await fetch("/api/cashier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          amount: selectedBooking.totalPrice,
          type: "ROOM_FEE",
          method: "CASH",
        }),
      });
      if (parseFloat(deposit) > 0) {
        await fetch("/api/cashier", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: selectedBooking.id,
            amount: parseFloat(deposit),
            type: "DEPOSIT",
            method: "CASH",
          }),
        });
      }
      alert("入住办理成功！");
      setSelectedBooking(null);
      setSelectedRoomId("");
      setIdCard("");
      setDeposit("");
      loadData();
    } finally {
      setProcessing(false);
    }
  }

  async function handleCheckOut(booking: Booking) {
    if (!confirm(`确认退房：${booking.guestName} - ${booking.room?.roomNumber}？`)) return;
    try {
      // Update booking
      await fetch(`/api/bookings/${booking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CHECKED_OUT" }),
      });
      // Update room status to cleaning
      if (booking.roomId) {
        await fetch(`/api/rooms/rooms/${booking.roomId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CLEANING" }),
        });
      }
      // Record deposit refund
      if (booking.deposit > 0) {
        await fetch("/api/cashier", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.id,
            amount: booking.deposit,
            type: "REFUND",
            method: "CASH",
          }),
        });
      }
      alert("退房办理成功！房间已标记为打扫中。");
      loadData();
    } catch (e) {
      alert("操作失败");
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">入住/退房</h2>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("checkin")}
          className={`px-4 py-2 rounded-lg ${tab === "checkin" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
        >
          办理入住
        </button>
        <button
          onClick={() => setTab("checkout")}
          className={`px-4 py-2 rounded-lg ${tab === "checkout" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
        >
          办理退房
        </button>
      </div>

      {tab === "checkin" && (
        <div className="space-y-4">
          {getPendingCheckins().length === 0 ? (
            <p className="text-center text-gray-400 py-12">暂无待入住的预订</p>
          ) : (
            getPendingCheckins().map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{booking.guestName}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {booking.roomType.name} · {format(new Date(booking.checkIn), "MM-dd")} ~{" "}
                      {format(new Date(booking.checkOut), "MM-dd")} · ¥{booking.totalPrice.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    办理入住
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "checkout" && (
        <div className="space-y-4">
          {getActiveCheckins().length === 0 ? (
            <p className="text-center text-gray-400 py-12">暂无在住客人</p>
          ) : (
            getActiveCheckins().map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{booking.guestName}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      房间 {booking.room?.roomNumber} · {booking.roomType.name} · 押金 ¥{booking.deposit.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCheckOut(booking)}
                    className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                  >
                    <LogOut className="w-4 h-4" />
                    办理退房
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Check-in modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => {
            setSelectedBooking(null);
            setSelectedRoomId("");
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">办理入住 - {selectedBooking.guestName}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">分配房间</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">请选择房间</option>
                  {availableRooms
                    .filter(
                      (r) => r.status === "AVAILABLE" && r.roomType.id === selectedBooking.roomType.id,
                    )
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.roomNumber} - {r.roomType.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">仅显示同房型且空闲的房间</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">身份证号</label>
                <input
                  type="text"
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="请输入客人身份证号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">押金金额</label>
                <input
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    setSelectedRoomId("");
                    setIdCard("");
                    setDeposit("");
                  }}
                  className="px-4 py-2 border rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={handleCheckIn}
                  disabled={processing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  确认入住
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
