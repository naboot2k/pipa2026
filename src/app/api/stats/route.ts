import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const roomTypeId = searchParams.get("roomTypeId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (startDate && endDate) {
    where.checkIn = { gte: startOfDay(new Date(startDate)), lte: endOfDay(new Date(endDate)) };
  }
  if (roomTypeId) where.roomTypeId = roomTypeId;
  if (status) where.status = status;

  // 1. All bookings with details
  const [bookings, roomTypes, totalByType, totalByStatus, totalByMethod, statusCounts] =
    await Promise.all([
      prisma.booking.findMany({
        where,
        include: { roomType: true, room: true, payments: true },
        orderBy: { checkIn: "desc" },
      }),
      prisma.roomType.findMany({ select: { id: true, name: true } }),
      prisma.payment.groupBy({
        by: ["type"],
        where: {},
        _sum: { amount: true },
      }),
      prisma.booking.groupBy({
        by: ["status"],
        where: roomTypeId ? { roomTypeId } : {},
        _sum: { totalPrice: true },
        _count: true,
      }),
      prisma.payment.groupBy({
        by: ["method"],
        where: {},
        _sum: { amount: true },
      }),
      prisma.booking.groupBy({
        by: ["status"],
        where: roomTypeId ? { roomTypeId } : {},
        _count: true,
      }),
    ]);

  // Calculate summary
  const roomFeeTotal = totalByType.find((t) => t.type === "ROOM_FEE")?._sum.amount ?? 0;
  const extraTotal = totalByType.find((t) => t.type === "EXTRA")?._sum.amount ?? 0;
  const mealTotal = totalByType.find((t) => t.type === "MEAL")?._sum.amount ?? 0;
  const refundTotal = totalByType.find((t) => t.type === "REFUND")?._sum.amount ?? 0;
  const netIncome = roomFeeTotal + extraTotal + mealTotal - refundTotal;

  // Group by room type
  const byRoomType = roomTypes.map((rt) => {
    const rtBookings = bookings.filter((b) => b.roomTypeId === rt.id);
    const rtRevenue = rtBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    return { id: rt.id, name: rt.name, count: rtBookings.length, revenue: rtRevenue };
  }).filter((r) => r.count > 0);

  return NextResponse.json({
    bookings,
    summary: {
      totalOrders: bookings.length,
      roomFee: roomFeeTotal,
      extraFee: extraTotal,
      mealFee: mealTotal,
      refund: refundTotal,
      netIncome,
    },
    byStatus: statusCounts.map((s) => ({
      status: s.status,
      count: s._count,
    })),
    byRoomType,
    byPaymentMethod: totalByMethod.map((m) => ({
      method: m.method,
      amount: m._sum.amount ?? 0,
    })),
  });
}
