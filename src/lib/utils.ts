import { eachDayOfInterval, format, isWeekend, subDays } from "date-fns";

export function calcTotalPrice(
  basePrice: number,
  weekendPrice: number | null,
  checkIn: Date,
  checkOut: Date,
): number {
  const nights = eachDayOfInterval({ start: checkIn, end: subDays(checkOut, 1) });
  let total = 0;
  for (const day of nights) {
    total += isWeekend(day) && weekendPrice ? weekendPrice : basePrice;
  }
  return total;
}

export function formatPrice(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDateTime(date: Date): string {
  return format(date, "yyyy-MM-dd HH:mm");
}
