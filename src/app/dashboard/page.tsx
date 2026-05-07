import { prisma } from "@/lib/prisma";
import { format, startOfDay, endOfDay } from "date-fns";
import Link from "next/link";
import { BedDouble, DoorOpen, UserPlus, UserMinus } from "lucide-react";

export default async function DashboardPage() {
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const [totalRooms, occupiedRooms, todayCheckIns, todayCheckOuts, pendingCheckIns, pendingCheckOuts] =
    await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: "OCCUPIED" } }),
      prisma.booking.count({
        where: {
          checkIn: { gte: todayStart, lte: todayEnd },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.booking.count({
        where: {
          checkOut: { gte: todayStart, lte: todayEnd },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.booking.count({
        where: {
          checkIn: { gte: todayStart, lte: todayEnd },
          status: "CONFIRMED",
        },
      }),
      prisma.booking.count({
        where: {
          checkOut: { gte: todayStart, lte: todayEnd },
          status: "CHECKED_IN",
        },
      }),
    ]);

  const occupancy = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : "0.0";

  const stats = [
    { label: "当前入住率", value: `${occupancy}%`, icon: BedDouble, color: "bg-blue-500" },
    { label: "今日入住", value: todayCheckIns, icon: DoorOpen, color: "bg-green-500" },
    { label: "今日退房", value: todayCheckOuts, icon: DoorOpen, color: "bg-orange-500" },
    { label: "今日待入住", value: pendingCheckIns, icon: UserPlus, color: "bg-teal-500" },
    { label: "今日待退房", value: pendingCheckOuts, icon: UserMinus, color: "bg-pink-500" },
  ];

  const recentBookings = await prisma.booking.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { roomType: true, room: true },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">仪表盘</h2>
      <p className="text-sm text-gray-500 mb-4">{format(today, "yyyy年MM月dd日 EEEE")}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${s.color} text-white`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold text-lg">最近预订</h3>
          <Link href="/bookings/new" className="text-sm text-blue-600 hover:underline">
            + 新建预订
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <p className="p-5 text-gray-400 text-center">暂无预订记录</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">客人</th>
                <th className="text-left p-3">房型</th>
                <th className="text-left p-3">入住日期</th>
                <th className="text-left p-3">离店日期</th>
                <th className="text-left p-3">状态</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{b.guestName}</td>
                  <td className="p-3">{b.roomType.name}</td>
                  <td className="p-3">{format(b.checkIn, "MM-dd")}</td>
                  <td className="p-3">{format(b.checkOut, "MM-dd")}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        b.status === "PENDING"
                          ? "bg-gray-100 text-gray-700"
                          : b.status === "CONFIRMED"
                            ? "bg-yellow-100 text-yellow-700"
                            : b.status === "CHECKED_IN"
                              ? "bg-blue-100 text-blue-700"
                              : b.status === "CHECKED_OUT"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                      }`}
                    >
                      {
                        {
                          PENDING: "待确认",
                          CONFIRMED: "已确认",
                          CHECKED_IN: "已入住",
                          CHECKED_OUT: "已退房",
                          CANCELLED: "已取消",
                        }[b.status]
                      }
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
