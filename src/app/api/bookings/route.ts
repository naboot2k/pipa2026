import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const bookings = await prisma.booking.findMany({
    where: status ? { status: status as any } : {},
    include: { roomType: true, room: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const body = await req.json();
  const checkIn = new Date(body.checkIn);
  const checkOut = new Date(body.checkOut);
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return NextResponse.json({ error: "日期格式无效" }, { status: 400 });
  }
  if (checkOut <= checkIn) {
    return NextResponse.json({ error: "离店日期必须晚于入住日期" }, { status: 400 });
  }
  const booking = await prisma.booking.create({
    data: {
      guestName: body.guestName,
      guestPhone: body.guestPhone,
      guestIdCard: body.guestIdCard || null,
      roomTypeId: body.roomTypeId,
      roomId: body.roomId || null,
      checkIn: new Date(body.checkIn),
      checkOut: new Date(body.checkOut),
      adults: parseInt(body.adults) || 1,
      children: parseInt(body.children) || 0,
      notes: body.notes || null,
      totalPrice: parseFloat(body.totalPrice),
      deposit: parseFloat(body.deposit) || 0,
      status: body.status || "PENDING",
    },
  });
  return NextResponse.json(booking);
}
