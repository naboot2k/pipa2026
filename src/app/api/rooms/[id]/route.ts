import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roomType = await prisma.roomType.findUnique({
    where: { id },
    include: { rooms: true },
  });
  if (!roomType) return NextResponse.json({ error: "房型不存在" }, { status: 404 });
  return NextResponse.json(roomType);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const roomType = await prisma.roomType.update({
    where: { id },
    data: {
      name: body.name,
      totalRooms: parseInt(body.totalRooms),
    },
  });
  return NextResponse.json(roomType);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.roomType.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
