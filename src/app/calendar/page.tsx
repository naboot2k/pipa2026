"use client";

import { useEffect, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameDay,
  isWithinInterval,
} from "date-fns";
import { ChevronLeft, ChevronRight, ArrowUpFromDot, ArrowDownToDot } from "lucide-react";

interface Room {
  id: string;
  roomNumber: string;
  status: string;
  roomType: { name: string };
}

interface Booking {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  roomId: string | null;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-gray-300",
  CONFIRMED: "bg-yellow-400",
  CHECKED_IN: "bg-blue-500",
  CHECKED_OUT: "bg-green-400",
  CANCELLED: "bg-red-300",
};

const statusLabels: Record<string, string> = {
  PENDING: "待确认",
  CONFIRMED: "已确认",
  CHECKED_IN: "已入住",
  CHECKED_OUT: "已退房",
  CANCELLED: "已取消",
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [roomsRes, bookingsRes] = await Promise.all([
      fetch("/api/rooms"),
      fetch("/api/bookings"),
    ]);
    const roomsData = await roomsRes.json();
    const bookingsData = await bookingsRes.json();
    const allRooms: Room[] = [];
    roomsData.forEach((rt: any) => {
      rt.rooms.forEach((room: any) => {
        allRooms.push({ ...room, roomType: { name: rt.name } });
      });
    });
    setRooms(allRooms);
    setBookings(bookingsData);
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  function getCheckoutsForDay(roomId: string, day: Date): Booking[] {
    return bookings.filter((b) => {
      if (b.roomId !== roomId) return false;
      return isSameDay(new Date(b.checkOut), day);
    });
  }

  function getCheckinsForDay(roomId: string, day: Date): Booking[] {
    return bookings.filter((b) => {
      if (b.roomId !== roomId) return false;
      return isSameDay(new Date(b.checkIn), day);
    });
  }

  function getStayBooking(roomId: string, day: Date): Booking | null {
    return bookings.find((b) => {
      if (b.roomId !== roomId) return false;
      const checkIn = new Date(b.checkIn);
      const checkOut = new Date(b.checkOut);
      return isWithinInterval(day, { start: checkIn, end: new Date(checkOut.getTime() - 86400000) });
    }) || null;
  }

  function isToday(day: Date) {
    return isSameDay(day, new Date());
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">房态日历</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-medium w-32 text-center">
            {format(currentMonth, "yyyy年MM月")}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header row */}
          <div className="flex border-b bg-gray-50 sticky top-0 z-10">
            <div className="w-28 flex-shrink-0 p-3 text-sm font-medium text-center border-r">
              房间
            </div>
            {days.map((day, i) => (
              <div
                key={i}
                className={`flex-1 min-w-[36px] p-1.5 text-center text-xs border-r last:border-r-0 ${
                  isToday(day) ? "bg-blue-50 font-bold text-blue-600" : ""
                }`}
              >
                <div>{format(day, "dd")}</div>
                <div className="text-gray-400 scale-75">{format(day, "E")}</div>
              </div>
            ))}
          </div>

          {/* Room rows */}
          {rooms.map((room) => (
            <div key={room.id} className="flex border-b hover:bg-gray-50/50">
              <div className="w-28 flex-shrink-0 p-2 text-sm border-r flex flex-col items-center justify-center bg-gray-50/50">
                <span className="font-semibold">{room.roomNumber}</span>
                <span className="text-[10px] text-gray-400 truncate w-full text-center">{room.roomType.name}</span>
              </div>
              {days.map((day, i) => {
                const checkouts = getCheckoutsForDay(room.id, day);
                const checkins = getCheckinsForDay(room.id, day);
                const stayBooking = getStayBooking(room.id, day);
                const today = isToday(day);
                // Stay guests also appear in both halves
                const stayGuests = stayBooking ? [stayBooking] : [];

                return (
                  <div
                    key={i}
                    className={`flex-1 min-w-[36px] border-r last:border-r-0 flex flex-col ${
                      today ? "bg-blue-50/50" : stayBooking ? "bg-blue-100/30" : ""
                    }`}
                  >
                    {/* Top: checkouts + stay guests */}
                    <div className="flex-1 min-h-[18px] flex items-start justify-center pt-0.5">
                      {checkouts.length > 0 ? (
                        <button
                          onClick={() => setSelectedBooking(checkouts[0])}
                          className="flex items-center gap-0.5 text-[10px] text-red-600 truncate max-w-full"
                          title={`退房: ${checkouts.map((b) => b.guestName).join(", ")}`}
                        >
                          <ArrowUpFromDot className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{checkouts[0].guestName}</span>
                        </button>
                      ) : stayGuests.length > 0 ? (
                        <button
                          onClick={() => setSelectedBooking(stayGuests[0])}
                          className="flex items-center gap-0.5 text-[10px] text-blue-600 truncate max-w-full"
                          title={`在住: ${stayGuests[0].guestName}`}
                        >
                          <ArrowUpFromDot className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{stayGuests[0].guestName}</span>
                        </button>
                      ) : null}
                    </div>
                    {/* Divider */}
                    <div className="border-t border-dashed border-gray-200" />
                    {/* Bottom: checkins + stay guests */}
                    <div className="flex-1 min-h-[18px] flex items-end justify-center pb-0.5">
                      {checkins.length > 0 ? (
                        <button
                          onClick={() => setSelectedBooking(checkins[0])}
                          className="flex items-center gap-0.5 text-[10px] text-green-600 truncate max-w-full"
                          title={`入住: ${checkins.map((b) => b.guestName).join(", ")}`}
                        >
                          <ArrowDownToDot className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{checkins[0].guestName}</span>
                        </button>
                      ) : stayGuests.length > 0 ? (
                        <button
                          onClick={() => setSelectedBooking(stayGuests[0])}
                          className="flex items-center gap-0.5 text-[10px] text-blue-600 truncate max-w-full"
                          title={`在住: ${stayGuests[0].guestName}`}
                        >
                          <ArrowDownToDot className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{stayGuests[0].guestName}</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {rooms.length === 0 && (
            <p className="p-8 text-center text-gray-400">暂无房间数据</p>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <ArrowUpFromDot className="w-3.5 h-3.5 text-red-500" />
          当日退房
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowDownToDot className="w-3.5 h-3.5 text-green-500" />
          当日入住
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUpFromDot className="w-3.5 h-3.5 text-blue-500" />
          当日在住（上下均显示）
        </div>
      </div>

      {/* Booking detail modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-3">预订详情</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-500">客人：</span>
                {selectedBooking.guestName}
              </p>
              <p>
                <span className="text-gray-500">入住：</span>
                {format(new Date(selectedBooking.checkIn), "yyyy-MM-dd")}
              </p>
              <p>
                <span className="text-gray-500">离店：</span>
                {format(new Date(selectedBooking.checkOut), "yyyy-MM-dd")}
              </p>
              <p>
                <span className="text-gray-500">状态：</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[selectedBooking.status]} text-white`}>
                  {statusLabels[selectedBooking.status]}
                </span>
              </p>
            </div>
            <button
              onClick={() => setSelectedBooking(null)}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
