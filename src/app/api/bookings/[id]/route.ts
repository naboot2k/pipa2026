import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { roomType: true, room: true },
  });
  if (!booking) return NextResponse.json({ error: "预订不存在" }, { status: 404 });
  return NextResponse.json(booking);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // Validate ID card format if provided
  if (body.guestIdCard !== undefined && body.guestIdCard !== null) {
    if (!/^\d{17}[\dXx]$/.test(body.guestIdCard)) {
      return NextResponse.json({ error: "身份证号格式无效（应为18位数字或17位数字+X）" }, { status: 400 });
    }
  }
  if (body.notes !== undefined && body.notes !== null) {
    try {
      const parsed = JSON.parse(body.notes);
      if (Array.isArray(parsed)) {
        for (const card of parsed) {
          if (!/^\d{17}[\dXx]$/.test(card)) {
            return NextResponse.json({ error: "身份证号格式无效（应为18位数字或17位数字+X）" }, { status: 400 });
          }
        }
      }
    } catch {
      // Not JSON, skip ID card validation
    }
  }

  // Check room conflict when assigning a room
  if (body.roomId) {
    const current = await prisma.booking.findUnique({ where: { id } });
    if (current) {
      const checkIn = body.checkIn ? new Date(body.checkIn) : current.checkIn;
      const checkOut = body.checkOut ? new Date(body.checkOut) : current.checkOut;
      const conflict = await prisma.booking.findFirst({
        where: {
          id: { not: id },
          roomId: body.roomId,
          status: { in: ["CHECKED_IN", "CONFIRMED"] },
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
        },
      });
      if (conflict) {
        return NextResponse.json(
          { error: `房间已被 ${conflict.guestName} 在 ${format(conflict.checkIn, "MM-dd")} ~ ${format(conflict.checkOut, "MM-dd")} 期间预订` },
          { status: 409 }
        );
      }
    }
  }

  // When checking out, auto-set room to AVAILABLE
  if (body.status === "CHECKED_OUT") {
    const current = await prisma.booking.findUnique({ where: { id } });
    if (current?.roomId) {
      await prisma.room.update({ where: { id: current.roomId }, data: { status: "AVAILABLE" } });
    }
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.roomId && { roomId: body.roomId }),
      ...(body.checkIn && { checkIn: new Date(body.checkIn) }),
      ...(body.checkOut && { checkOut: new Date(body.checkOut) }),
      ...(body.guestName && { guestName: body.guestName }),
      ...(body.guestPhone !== undefined && { guestPhone: body.guestPhone }),
      ...(body.guestIdCard !== undefined && { guestIdCard: body.guestIdCard }),
      ...(body.guestAddress !== undefined && { guestAddress: body.guestAddress }),
      ...(body.emergencyContact !== undefined && { emergencyContact: body.emergencyContact }),
      ...(body.emergencyPhone !== undefined && { emergencyPhone: body.emergencyPhone }),
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
