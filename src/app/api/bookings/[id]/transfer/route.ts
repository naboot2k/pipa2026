import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { newRoomId, reason } = body;

  if (!newRoomId) {
    return NextResponse.json({ error: "请选择新房间" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { room: true, roomType: true },
  });

  if (!booking) return NextResponse.json({ error: "预订不存在" }, { status: 404 });
  if (booking.status !== "CHECKED_IN") {
    return NextResponse.json({ error: "仅已入住的预订可以调房" }, { status: 400 });
  }
  if (!booking.roomId || !booking.room) {
    return NextResponse.json({ error: "该预订未分配房间" }, { status: 400 });
  }

  const newRoom = await prisma.room.findUnique({
    where: { id: newRoomId },
    include: { roomType: true },
  });

  if (!newRoom) return NextResponse.json({ error: "新房间不存在" }, { status: 404 });
  if (newRoom.status !== "AVAILABLE") {
    return NextResponse.json({ error: "新房间不可用（非空闲状态）" }, { status: 400 });
  }
  if (newRoom.roomTypeId !== booking.roomTypeId) {
    return NextResponse.json({ error: "新房间房型与预订房型不匹配" }, { status: 400 });
  }

  // Use UTC-midnight date (consistent with new Date("yyyy-MM-dd") from booking form)
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayDate = new Date(todayStr);
  const stayStart = format(booking.checkIn, "yyyy-MM-dd");
  const stayEnd = format(booking.checkOut, "yyyy-MM-dd");

  if (todayStr < stayStart || todayStr >= stayEnd) {
    return NextResponse.json({ error: "当前日期不在入住期间内，无法调房" }, { status: 400 });
  }

  // Check conflict on new room from today onwards
  const conflict = await prisma.booking.findFirst({
    where: {
      id: { not: id },
      roomId: newRoomId,
      status: { in: ["CHECKED_IN", "CONFIRMED"] },
      checkIn: { lt: booking.checkOut },
      checkOut: { gt: todayDate },
    },
  });
  if (conflict) {
    return NextResponse.json(
      {
        error: `房间已被 ${conflict.guestName} 在 ${format(conflict.checkIn, "MM-dd")} ~ ${format(conflict.checkOut, "MM-dd")} 期间预订`,
      },
      { status: 409 },
    );
  }

  const oldRoomNumber = booking.room.roomNumber;
  const newRoomNumber = newRoom.roomNumber;
  const transferLog = `[调房] ${todayStr} 从 ${oldRoomNumber} 调至 ${newRoomNumber}${reason ? `，原因：${reason}` : ""}`;

  const newBooking = await prisma.$transaction(async (tx) => {
    // End original booking at today (keep history on old room)
    await tx.booking.update({
      where: { id },
      data: {
        checkOut: todayDate,
        status: "CHECKED_OUT",
        notes: booking.notes ? `${booking.notes}\n${transferLog}` : transferLog,
      },
    });

    // Release old room
    await tx.room.update({ where: { id: booking.roomId! }, data: { status: "AVAILABLE" } });

    // Occupy new room
    await tx.room.update({ where: { id: newRoomId }, data: { status: "OCCUPIED" } });

    // Create new booking for remaining days on new room
    return tx.booking.create({
      data: {
        guestName: booking.guestName,
        guestPhone: booking.guestPhone,
        guestIdCard: booking.guestIdCard,
        guestAddress: booking.guestAddress,
        emergencyContact: booking.emergencyContact,
        emergencyPhone: booking.emergencyPhone,
        roomTypeId: booking.roomTypeId,
        roomId: newRoomId,
        checkIn: todayDate,
        checkOut: booking.checkOut,
        status: "CHECKED_IN",
        adults: booking.adults,
        children: booking.children,
        notes: transferLog,
      },
      include: { roomType: true, room: true },
    });
  });

  return NextResponse.json({ success: true, booking: newBooking });
}
