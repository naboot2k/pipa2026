"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CheckCircle, LogOut, Plus, X } from "lucide-react";

interface Booking {
  id: string;
  guestName: string;
  guestPhone: string | null;
  checkIn: string;
  checkOut: string;
  status: string;
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
  const [idCards, setIdCards] = useState<string[]>([""]);
  const [phone, setPhone] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    const res = await fetch("/api/bookings", { cache: "no-store" });
    const data = await res.json();
    setBookings(data);

    const roomsRes = await fetch("/api/rooms", { cache: "no-store" });
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

  function addIdCard() {
    setIdCards([...idCards, ""]);
  }

  function removeIdCard(index: number) {
    if (idCards.length > 1) {
      setIdCards(idCards.filter((_, i) => i !== index));
    }
  }

  function updateIdCard(index: number, value: string) {
    const updated = [...idCards];
    updated[index] = value;
    setIdCards(updated);
  }

  function validateIdCard(card: string): string | null {
    if (!card.trim()) return null;
    if (!/^\d{17}[\dXx]$/.test(card.trim())) return "身份证号格式无效（18位数字或17位数字+X）";
    return null;
  }

  async function handleCheckIn() {
    if (!selectedBooking || !selectedRoomId) {
      alert("请选择房间");
      return;
    }
    const filledCards = idCards.filter((c) => c.trim());
    // Validate ID cards
    for (const card of filledCards) {
      const err = validateIdCard(card);
      if (err) {
        alert(err);
        return;
      }
    }
    setProcessing(true);
    try {
      // Fetch existing notes to preserve them
      const bookingRes = await fetch(`/api/bookings/${selectedBooking.id}`);
      const bookingData = await bookingRes.json();
      const existingNotes = bookingData.notes || "";

      // Build extra ID card data with separator to preserve real notes
      let finalNotes: string | null = null;
      if (filledCards.length > 1) {
        const extraCards = filledCards.slice(1);
        const idPart = JSON.stringify(extraCards);
        // Extract existing real notes (strip old ID card data)
        let realNotes = existingNotes;
        if (realNotes.includes("\n|||ID_END|||\n")) {
          realNotes = realNotes.split("\n|||ID_END|||\n")[1] || "";
        } else {
          try {
            // If entire notes is just a JSON array, it's old ID card data
            const parsed = JSON.parse(realNotes);
            if (Array.isArray(parsed)) realNotes = "";
          } catch {}
        }
        finalNotes = realNotes ? `${idPart}\n|||ID_END|||\n${realNotes}` : idPart;
      } else if (existingNotes && !existingNotes.includes("\n|||ID_END|||\n")) {
        // Keep existing notes if they're not old ID-only format
        try {
          const parsed = JSON.parse(existingNotes);
          if (!Array.isArray(parsed)) finalNotes = existingNotes;
        } catch {
          finalNotes = existingNotes;
        }
      }

      const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CHECKED_IN",
          roomId: selectedRoomId,
          guestPhone: phone || null,
          guestIdCard: filledCards[0] || null,
          notes: finalNotes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "操作失败");
        return;
      }
      await fetch(`/api/rooms/rooms/${selectedRoomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OCCUPIED" }),
      });
      alert("入住办理成功！");
      setSelectedBooking(null);
      setSelectedRoomId("");
      setIdCards([""]);
      setPhone("");
      loadData();
    } finally {
      setProcessing(false);
    }
  }

  async function handleCheckOut(booking: Booking) {
    if (!confirm(`确认退房：${booking.guestName} - ${booking.room?.roomNumber}？`)) return;
    try {
      await fetch(`/api/bookings/${booking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CHECKED_OUT" }),
      });
      if (booking.roomId) {
        await fetch(`/api/rooms/rooms/${booking.roomId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "AVAILABLE" }),
        });
      }
      alert("退房办理成功！房间已标记为空闲。");
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
                      {format(new Date(booking.checkOut), "MM-dd")}
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
                      房间 {booking.room?.roomNumber} · {booking.roomType.name}
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

      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => {
            setSelectedBooking(null);
            setSelectedRoomId("");
            setIdCards([""]);
            setPhone("");
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
                <label className="block text-sm font-medium mb-2">身份证号</label>
                {idCards.map((card, i) => {
                  const err = validateIdCard(card);
                  return (
                    <div key={i} className="flex gap-2 mb-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={card}
                          onChange={(e) => updateIdCard(i, e.target.value)}
                          className={`w-full border rounded-lg px-3 py-2 ${err ? "border-red-400 bg-red-50" : ""}`}
                          placeholder={i === 0 ? "主入住人身份证号" : "同住人身份证号"}
                        />
                        {err && <p className="text-xs text-red-500 mt-0.5">{err}</p>}
                      </div>
                      {idCards.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIdCard(i)}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addIdCard}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加同住人
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">联系电话</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="请输入客人联系电话"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    setSelectedRoomId("");
                    setIdCards([""]);
                    setPhone("");
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
