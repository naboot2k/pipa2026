import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const room = await prisma.room.create({
    data: { roomNumber: body.roomNumber, roomType: { connect: { id } } },
  });
  return NextResponse.json(room);
}
