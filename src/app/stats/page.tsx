"use client";

import React, { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ChevronDown, ChevronUp, Download, BarChart3 } from "lucide-react";

interface Booking {
  id: string;
  guestName: string;
  guestPhone: string;
  guestIdCard: string | null;
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: number;
  deposit: number;
  roomType: { name: string };
  room: { roomNumber: string } | null;
  payments: { amount: number; type: string; method: string }[];
}

interface StatsData {
  bookings: Booking[];
  summary: {
    totalOrders: number;
    roomFee: number;
    extraFee: number;
    mealFee: number;
    refund: number;
    netIncome: number;
  };
  byStatus: { status: string; count: number }[];
  byRoomType: { id: string; name: string; count: number; revenue: number }[];
  byPaymentMethod: { method: string; amount: number }[];
}

const statusLabels: Record<string, string> = {
  PENDING: "待确认",
  CONFIRMED: "已确认",
  CHECKED_IN: "已入住",
  CHECKED_OUT: "已退房",
  CANCELLED: "已取消",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  CONFIRMED: "bg-yellow-100 text-yellow-700",
  CHECKED_IN: "bg-blue-100 text-blue-700",
  CHECKED_OUT: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const methodLabels: Record<string, string> = {
  CASH: "现金",
  WECHAT: "微信",
  ALIPAY: "支付宝",
  CARD: "刷卡",
};

const typeLabels: Record<string, string> = {
  ROOM_FEE: "房费",
  DEPOSIT: "押金",
  MEAL: "餐费",
  EXTRA: "杂费",
  REFUND: "退款",
};

export default function StatsPage() {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(today), "yyyy-MM-dd"),
    end: format(endOfMonth(today), "yyyy-MM-dd"),
  });
  const [filterRoomType, setFilterRoomType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [data, setData] = useState<StatsData | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [roomTypes, setRoomTypes] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/rooms")
      .then((r) => r.json())
      .then((d: any[]) => setRoomTypes(d.map((rt) => ({ id: rt.id, name: rt.name }))));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({
      startDate: dateRange.start,
      endDate: dateRange.end,
    });
    if (filterRoomType) params.set("roomTypeId", filterRoomType);
    if (filterStatus) params.set("status", filterStatus);
    fetch(`/api/stats?${params}`)
      .then((r) => r.json())
      .then(setData);
  }, [dateRange, filterRoomType, filterStatus]);

  function exportCSV() {
    if (!data) return;
    const headers = ["订单号", "客人", "电话", "身份证号", "房型", "房间", "入住日期", "离店日期", "状态", "总价", "已付"];
    const rows = data.bookings.map((b) => {
      const paid = b.payments.reduce((sum, p) => sum + (p.type === "REFUND" ? -p.amount : p.amount), 0);
      return [
        b.id,
        b.guestName,
        b.guestPhone,
        b.guestIdCard || "-",
        b.roomType.name,
        b.room?.roomNumber || "-",
        format(new Date(b.checkIn), "yyyy-MM-dd"),
        format(new Date(b.checkOut), "yyyy-MM-dd"),
        statusLabels[b.status],
        b.totalPrice.toFixed(2),
        paid.toFixed(2),
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `订单统计_${dateRange.start}_${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function quickRange(months: number) {
    const end = endOfMonth(today);
    const start = startOfMonth(subMonths(today, months));
    setDateRange({ start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") });
  }

  const maxRevenue = data?.byRoomType.reduce((m, r) => Math.max(m, r.revenue), 0) ?? 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">订单统计</h2>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Download className="w-4 h-4" />
          导出 CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">日期范围：</span>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="border rounded-lg px-2 py-1.5 text-sm"
            />
            <span className="text-gray-400">~</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="border rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex gap-1">
            <button onClick={() => quickRange(0)} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">
              本月
            </button>
            <button onClick={() => quickRange(1)} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">
              近2月
            </button>
            <button onClick={() => quickRange(2)} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">
              近3月
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">房型：</span>
            <select
              value={filterRoomType}
              onChange={(e) => setFilterRoomType(e.target.value)}
              className="border rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">全部</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">状态：</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">全部</option>
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-500">总订单</p>
              <p className="text-xl font-bold">{data.summary.totalOrders}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-500">房费收入</p>
              <p className="text-xl font-bold text-green-600">¥{data.summary.roomFee.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-500">杂费+餐费</p>
              <p className="text-xl font-bold">¥{(data.summary.extraFee + data.summary.mealFee).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-500">退款</p>
              <p className="text-xl font-bold text-red-500">¥{data.summary.refund.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-500">净收入</p>
              <p className="text-xl font-bold text-blue-600">¥{data.summary.netIncome.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-gray-500">已入住</p>
              <p className="text-xl font-bold">
                {data.byStatus.find((s) => s.status === "CHECKED_IN")?.count ?? 0}
              </p>
            </div>
          </div>

          {/* By room type bar chart */}
          {data.byRoomType.length > 0 && (
            <div className="bg-white rounded-lg shadow p-5 mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                按房型营收分布
              </h3>
              <div className="space-y-2">
                {data.byRoomType.map((rt) => (
                  <div key={rt.id} className="flex items-center gap-3">
                    <span className="text-sm w-24 text-right">{rt.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${Math.max((rt.revenue / maxRevenue) * 100, 8)}%` }}
                      >
                        <span className="text-xs text-white font-medium">¥{rt.revenue.toFixed(0)}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 w-12">{rt.count} 单</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By payment method */}
          {data.byPaymentMethod.length > 0 && (
            <div className="bg-white rounded-lg shadow p-5 mb-6">
              <h3 className="font-semibold mb-3">按支付方式</h3>
              <div className="flex gap-6 flex-wrap">
                {data.byPaymentMethod.map((m) => (
                  <div key={m.method}>
                    <span className="text-sm text-gray-500">{methodLabels[m.method]}</span>
                    <p className="text-lg font-semibold">¥{m.amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <h3 className="font-semibold p-5 border-b">订单明细</h3>
            {data.bookings.length === 0 ? (
              <p className="p-8 text-center text-gray-400">该时间段内无订单</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3">订单号</th>
                    <th className="text-left p-3">客人</th>
                    <th className="text-left p-3">身份证号</th>
                    <th className="text-left p-3">房型</th>
                    <th className="text-left p-3">房间</th>
                    <th className="text-left p-3">入住日期</th>
                    <th className="text-left p-3">离店日期</th>
                    <th className="text-left p-3">总价</th>
                    <th className="text-left p-3">状态</th>
                    <th className="text-left p-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bookings.map((b) => {
                    const paid = b.payments.reduce(
                      (sum, p) => sum + (p.type === "REFUND" ? -p.amount : p.amount),
                      0,
                    );
                    const isExpanded = expandedBooking === b.id;
                    return (
                      <React.Fragment key={b.id}>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="p-3 font-mono text-xs">{b.id.slice(-8)}</td>
                          <td className="p-3">
                            {b.guestName}
                            <span className="text-xs text-gray-400 ml-1">{b.guestPhone}</span>
                          </td>
                          <td className="p-3 font-mono text-xs">{b.guestIdCard || "-"}</td>
                          <td className="p-3">{b.roomType.name}</td>
                          <td className="p-3">{b.room?.roomNumber || "-"}</td>
                          <td className="p-3">{format(new Date(b.checkIn), "MM-dd")}</td>
                          <td className="p-3">{format(new Date(b.checkOut), "MM-dd")}</td>
                          <td className="p-3 font-medium">¥{b.totalPrice.toFixed(2)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[b.status]}`}>
                              {statusLabels[b.status]}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => setExpandedBooking(isExpanded ? null : b.id)}
                              className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                              支付明细
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-blue-50/50">
                            <td colSpan={9} className="p-4">
                              {b.payments.length === 0 ? (
                                <p className="text-xs text-gray-400">暂无支付记录</p>
                              ) : (
                                <div className="space-y-1">
                                  {b.payments.map((p) => (
                                    <div key={p.id || `${p.type}-${p.amount}`} className="flex justify-between text-sm">
                                      <span>
                                        {typeLabels[p.type]} · {methodLabels[p.method]}
                                      </span>
                                      <span className={p.type === "REFUND" ? "text-red-600" : "text-green-600"}>
                                        {p.type === "REFUND" ? "-" : "+"}¥{p.amount.toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                  <div className="border-t pt-1 mt-1 flex justify-between text-sm font-medium">
                                    <span>已付合计</span>
                                    <span className="text-blue-600">¥{paid.toFixed(2)}</span>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
