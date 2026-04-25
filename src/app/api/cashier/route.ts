import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const start = date ? startOfDay(new Date(date)) : startOfDay(new Date());
  const end = date ? endOfDay(new Date(date)) : endOfDay(new Date());

  const payments = await prisma.payment.findMany({
    where: { createdAt: { gte: start, lte: end } },
    include: { booking: { include: { roomType: true } } },
    orderBy: { createdAt: "desc" },
  });

  const summary = await prisma.payment.groupBy({
    by: ["method"],
    where: { createdAt: { gte: start, lte: end } },
    _sum: { amount: true },
  });

  const totalByType = await prisma.payment.groupBy({
    by: ["type"],
    where: { createdAt: { gte: start, lte: end } },
    _sum: { amount: true },
  });

  return NextResponse.json({ payments, summary, totalByType });
}

export async function POST(req: Request) {
  const body = await req.json();
  const payment = await prisma.payment.create({
    data: {
      bookingId: body.bookingId,
      amount: parseFloat(body.amount),
      type: body.type,
      method: body.method,
    },
  });
  return NextResponse.json(payment);
}
