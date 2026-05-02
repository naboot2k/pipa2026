"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/rooms", label: "房型管理", icon: BedDouble },
  { href: "/calendar", label: "房态日历", icon: CalendarDays },
  { href: "/bookings", label: "预订管理", icon: ClipboardList },
  { href: "/checkin", label: "入住/退房", icon: DoorOpen },
  { href: "/guests", label: "入住人员", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-slate-900 text-white flex flex-col">
      <div className="p-5 border-b border-slate-700">
        <h1 className="text-lg font-bold">枇杷树下民宿</h1>
        <p className="text-xs text-slate-400 mt-1">前台管理系统</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
