"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CheckCircle, LogOut, Plus, X, ArrowLeftRight } from "lucide-react";

interface Booking {
  id: string;
  guestName: string;
  guestPhone: string | null;
  guestIdCard: string | null;
  checkIn: string;
  checkOut: string;
  status: string;
  notes: string | null;
  roomTypeId: string;
  roomId: string | null;
  roomType: { id: string; name: string };
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
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [processing, setProcessing] = useState(false);
  const [transferBooking, setTransferBooking] = useState<Booking | null>(null);
  const [transferNewRoomId, setTransferNewRoomId] = useState("");
  const [transferReason, setTransferReason] = useState("");

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
      const existingNotes = selectedBooking.notes || "";

      // Extract real notes (strip any stored ID card data)
      let realNotes = "";
      if (existingNotes) {
        if (existingNotes.includes("\n|||ID_END|||\n")) {
          realNotes = existingNotes.split("\n|||ID_END|||\n")[1] || "";
        } else {
          try {
            const parsed = JSON.parse(existingNotes);
            if (!Array.isArray(parsed)) realNotes = existingNotes;
          } catch {
            realNotes = existingNotes;
          }
        }
      }

      // Store extra ID cards in notes with separator; keep real notes intact
      let finalNotes: string | null = null;
      if (filledCards.length > 1) {
        const idPart = JSON.stringify(filledCards.slice(1));
        finalNotes = realNotes ? `${idPart}\n|||ID_END|||\n${realNotes}` : idPart;
      } else {
        finalNotes = realNotes || null;
      }

      const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CHECKED_IN",
          roomId: selectedRoomId,
          guestPhone: phone || null,
          guestIdCard: filledCards[0] || null,
          adults: parseInt(adults) || 1,
          children: parseInt(children) || 0,
          notes: finalNotes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "操作失败");
        return;
      }
      alert("入住办理成功！");
      setSelectedBooking(null);
      setSelectedRoomId("");
      setIdCards([""]);
      setPhone("");
      setAdults("1");
      setChildren("0");
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
      alert("退房办理成功！房间已标记为空闲。");
      loadData();
    } catch (e) {
      alert("操作失败");
    }
  }

  async function handleTransfer() {
    if (!transferBooking || !transferNewRoomId) {
      alert("请选择新房间");
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch(`/api/bookings/${transferBooking.id}/transfer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRoomId: transferNewRoomId, reason: transferReason || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "调房失败");
        return;
      }
      alert("调房成功！");
      setTransferBooking(null);
      setTransferNewRoomId("");
      setTransferReason("");
      loadData();
    } finally {
      setProcessing(false);
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
                      {booking.roomType.name}
                      {booking.room && <span className="text-blue-600"> · 房间 {booking.room.roomNumber}</span>}
                      {" · "}
                      {format(new Date(booking.checkIn), "MM-dd")} ~{" "}
                      {format(new Date(booking.checkOut), "MM-dd")}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBooking(booking);
                      setSelectedRoomId(booking.roomId || "");
                    }}
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setTransferBooking(booking);
                        setTransferNewRoomId("");
                        setTransferReason("");
                      }}
                      className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      调房
                    </button>
                    <button
                      onClick={() => handleCheckOut(booking)}
                      className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                    >
                      <LogOut className="w-4 h-4" />
                      办理退房
                    </button>
                  </div>
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
            setAdults("1");
            setChildren("0");
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
                      (r) =>
                        (r.status === "AVAILABLE" || r.id === selectedBooking.roomId) &&
                        r.roomType.id === selectedBooking.roomType.id,
                    )
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.roomNumber} - {r.roomType.name}
                      </option>
                    ))}
                </select>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">成人数</label>
                  <input
                    type="number"
                    min="1"
                    value={adults}
                    onChange={(e) => setAdults(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">儿童数</label>
                  <input
                    type="number"
                    min="0"
                    value={children}
                    onChange={(e) => setChildren(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    setSelectedRoomId("");
                    setIdCards([""]);
                    setPhone("");
                    setAdults("1");
                    setChildren("0");
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

      {transferBooking && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => {
            setTransferBooking(null);
            setTransferNewRoomId("");
            setTransferReason("");
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">调房 - {transferBooking.guestName}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">当前房间</label>
                <input
                  type="text"
                  value={transferBooking.room?.roomNumber || "-"}
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">新房间</label>
                <select
                  value={transferNewRoomId}
                  onChange={(e) => setTransferNewRoomId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">请选择新房间</option>
                  {availableRooms
                    .filter(
                      (r) =>
                        r.status === "AVAILABLE" &&
                        r.roomType.id === transferBooking.roomType.id &&
                        r.id !== transferBooking.roomId,
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
                <label className="block text-sm font-medium mb-1">调房原因（可选）</label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 h-16"
                  placeholder="请输入调房原因"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => {
                    setTransferBooking(null);
                    setTransferNewRoomId("");
                    setTransferReason("");
                  }}
                  className="px-4 py-2 border rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  确认调房
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
