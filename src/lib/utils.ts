import { format } from "date-fns";

export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDateTime(date: Date): string {
  return format(date, "yyyy-MM-dd HH:mm");
}
