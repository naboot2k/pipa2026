"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Search, User } from "lucide-react";

interface Guest {
  id: string;
  guestName: string;
  guestPhone: string | null;
  guestIdCard: string | null;
  checkIn: string;
  checkOut: string;
  status: string;
  adults: number;
  children: number;
  notes: string | null;
  room: { roomNumber: string } | null;
  roomType: { name: string };
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

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  useEffect(() => {
    fetchGuests();
  }, []);

  async function fetchGuests() {
    const res = await fetch("/api/bookings", { cache: "no-store" });
    const data = await res.json();
    setGuests(data);
  }

  const filtered = guests.filter((g) => {
    const matchSearch =
      !search ||
      g.guestName.includes(search) ||
      (g.guestPhone && g.guestPhone.includes(search)) ||
      (g.guestIdCard && g.guestIdCard.includes(search)) ||
      (g.room?.roomNumber && g.room.roomNumber.includes(search));
    const matchStatus = !filterStatus || g.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">入住人员</h2>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索姓名、电话、身份证、房号"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">状态：</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">全部</option>
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Guest cards */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-12 bg-white rounded-lg shadow">暂无入住人员</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-lg shadow p-5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedGuest(g)}
            >
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2.5 flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg truncate">{g.guestName}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[g.status]}`}>
                      {statusLabels[g.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {g.roomType.name} {g.room?.roomNumber && `· 房间 ${g.room.roomNumber}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {format(new Date(g.checkIn), "MM-dd")} ~ {format(new Date(g.checkOut), "MM-dd")}
                    {g.adults > 0 && ` · 成人 ${g.adults}`}
                    {g.children > 0 && ` · 儿童 ${g.children}`}
                  </p>
                  {g.guestPhone && (
                    <p className="text-xs text-gray-500 mt-1">电话：{g.guestPhone}</p>
                  )}
                  {g.guestIdCard && (
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">
                      身份证：{g.guestIdCard}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedGuest && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setSelectedGuest(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-blue-100 rounded-full p-2.5">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{selectedGuest.guestName}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[selectedGuest.status]}`}>
                  {statusLabels[selectedGuest.status]}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500">房型</span>
                  <p className="font-medium">{selectedGuest.roomType.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">房间</span>
                  <p className="font-medium">{selectedGuest.room?.roomNumber || "未分配"}</p>
                </div>
                <div>
                  <span className="text-gray-500">入住日期</span>
                  <p className="font-medium">{format(new Date(selectedGuest.checkIn), "yyyy-MM-dd")}</p>
                </div>
                <div>
                  <span className="text-gray-500">离店日期</span>
                  <p className="font-medium">{format(new Date(selectedGuest.checkOut), "yyyy-MM-dd")}</p>
                </div>
                <div>
                  <span className="text-gray-500">成人数</span>
                  <p className="font-medium">{selectedGuest.adults}</p>
                </div>
                <div>
                  <span className="text-gray-500">儿童数</span>
                  <p className="font-medium">{selectedGuest.children}</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <h4 className="font-semibold mb-2 text-gray-700">联系信息</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500">联系电话</span>
                    <p className="font-medium">{selectedGuest.guestPhone || "未填写"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">身份证号</span>
                    {(() => {
                      const cards: string[] = selectedGuest.guestIdCard ? [selectedGuest.guestIdCard] : [];
                      let realNotes: string | null = selectedGuest.notes;
                      try {
                        if (realNotes) {
                          // Handle separator format: <JSON IDs>\n|||ID_END|||\n<real notes>
                          if (realNotes.includes("\n|||ID_END|||\n")) {
                            const parts = realNotes.split("\n|||ID_END|||\n");
                            const idPart = JSON.parse(parts[0]);
                            if (Array.isArray(idPart)) cards.push(...idPart);
                            realNotes = parts[1] || null;
                          } else {
                            // Legacy: entire notes is just a JSON array of IDs
                            const parsed = JSON.parse(realNotes);
                            if (Array.isArray(parsed)) {
                              cards.push(...parsed);
                              realNotes = null;
                            }
                          }
                        }
                      } catch {}
                      return cards.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {cards.map((c, i) => (
                            <span key={i} className="font-mono text-sm bg-gray-50 px-2 py-0.5 rounded">
                              {c}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="font-medium">未填写</p>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {(() => {
                let realNotes: string | null = null;
                if (selectedGuest.notes) {
                  if (selectedGuest.notes.includes("\n|||ID_END|||\n")) {
                    realNotes = selectedGuest.notes.split("\n|||ID_END|||\n")[1] || null;
                  } else {
                    try {
                      const parsed = JSON.parse(selectedGuest.notes);
                      if (!Array.isArray(parsed)) realNotes = selectedGuest.notes;
                    } catch {
                      realNotes = selectedGuest.notes;
                    }
                  }
                }
                return realNotes ? (
                  <div className="border-t pt-3">
                    <h4 className="font-semibold mb-1 text-gray-700">备注</h4>
                    <p className="text-gray-600">{realNotes}</p>
                  </div>
                ) : null;
              })()}
            </div>

            <button
              onClick={() => setSelectedGuest(null)}
              className="mt-5 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
