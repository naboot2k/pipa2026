import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const bookings = await prisma.booking.findMany({
    where: status ? { status: status as any } : {},
    include: { roomType: true, room: true },
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

  // Validate ID card format if provided
  if (body.guestIdCard && !/^\d{17}[\dXx]$/.test(body.guestIdCard)) {
    return NextResponse.json({ error: "身份证号格式无效（应为18位数字或17位数字+X）" }, { status: 400 });
  }
  if (body.notes) {
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

  try {
    const booking = await prisma.$transaction(async (tx) => {
      // Check room conflict when assigning a room
      if (body.roomId) {
        const conflict = await tx.booking.findFirst({
          where: {
            roomId: body.roomId,
            status: { in: ["CHECKED_IN", "CONFIRMED"] },
            checkIn: { lt: checkOut },
            checkOut: { gt: checkIn },
          },
        });
        if (conflict) {
          throw new Error(`房间已被 ${conflict.guestName} 在 ${format(conflict.checkIn, "MM-dd")} ~ ${format(conflict.checkOut, "MM-dd")} 期间预订`);
        }
      }

      return tx.booking.create({
        data: {
          guestName: body.guestName,
          guestPhone: body.guestPhone || null,
          guestIdCard: body.guestIdCard || null,
          guestAddress: body.guestAddress || null,
          emergencyContact: body.emergencyContact || null,
          emergencyPhone: body.emergencyPhone || null,
          roomType: { connect: { id: body.roomTypeId } },
          ...(body.roomId && { room: { connect: { id: body.roomId } } }),
          checkIn,
          checkOut,
          adults: parseInt(body.adults) || 1,
          children: parseInt(body.children) || 0,
          notes: body.notes || null,
          status: body.status || "PENDING",
        },
      });
    });

    return NextResponse.json(booking);
  } catch (e: any) {
    if (e.message?.includes("房间已被")) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    throw e;
  }
}
