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
  if (!body.name || body.name.trim() === "") {
    return NextResponse.json({ error: "房型名称不能为空" }, { status: 400 });
  }
  const totalRooms = parseInt(body.totalRooms);
  if (isNaN(totalRooms) || totalRooms < 0) {
    return NextResponse.json({ error: "房间总数无效" }, { status: 400 });
  }
  const roomType = await prisma.roomType.update({
    where: { id },
    data: {
      name: body.name,
      totalRooms,
    },
  });
  return NextResponse.json(roomType);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.roomType.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
