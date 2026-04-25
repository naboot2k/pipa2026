import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { roomType: true, room: true, payments: true },
  });
  if (!booking) return NextResponse.json({ error: "预订不存在" }, { status: 404 });
  return NextResponse.json(booking);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const booking = await prisma.booking.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.roomId && { roomId: body.roomId }),
      ...(body.checkIn && { checkIn: new Date(body.checkIn) }),
      ...(body.checkOut && { checkOut: new Date(body.checkOut) }),
      ...(body.totalPrice !== undefined && { totalPrice: parseFloat(body.totalPrice) }),
      ...(body.deposit !== undefined && { deposit: parseFloat(body.deposit) }),
      ...(body.guestName && { guestName: body.guestName }),
      ...(body.guestPhone && { guestPhone: body.guestPhone }),
      ...(body.guestIdCard && { guestIdCard: body.guestIdCard }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });
  return NextResponse.json(booking);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.booking.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
