import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const roomTypes = await prisma.roomType.findMany({
    include: { rooms: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(roomTypes);
}

export async function POST(req: Request) {
  const body = await req.json();
  const roomType = await prisma.roomType.create({
    data: {
      name: body.name,
      price: parseFloat(body.price),
      weekendPrice: body.weekendPrice ? parseFloat(body.weekendPrice) : null,
      description: body.description || null,
      totalRooms: parseInt(body.totalRooms) || 0,
    },
  });
  return NextResponse.json(roomType);
}
