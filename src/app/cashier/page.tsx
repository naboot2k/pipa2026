"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Wallet } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  type: string;
  method: string;
  createdAt: string;
  booking: {
    guestName: string;
    roomType: { name: string };
  };
}

const typeLabels: Record<string, string> = {
  ROOM_FEE: "房费",
  DEPOSIT: "押金",
  MEAL: "餐费",
  EXTRA: "杂费",
  REFUND: "退款",
};

const methodLabels: Record<string, string> = {
  CASH: "现金",
  WECHAT: "微信",
  ALIPAY: "支付宝",
  CARD: "刷卡",
};

export default function CashierPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<{ method: string; _sum: { amount: number | null } }[]>([]);
  const [totalByType, setTotalByType] = useState<{ type: string; _sum: { amount: number | null } }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    bookingId: "",
    amount: "",
    type: "EXTRA",
    method: "CASH",
  });
  const [bookings, setBookings] = useState<{ id: string; guestName: string }[]>([]);

  useEffect(() => {
    loadData();
  }, [date]);

  useEffect(() => {
    if (showModal) {
      fetch("/api/bookings")
        .then((r) => r.json())
        .then((data: any[]) =>
          setBookings(
            data.filter(
              (b) => b.status === "CHECKED_IN" || b.status === "CONFIRMED",
            ),
          ),
        );
    }
  }, [showModal]);

  async function loadData() {
    const res = await fetch(`/api/cashier?date=${date}`);
    const data = await res.json();
    setPayments(data.payments);
    setSummary(data.summary);
    setTotalByType(data.totalByType);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/cashier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPayment),
    });
    setShowModal(false);
    setNewPayment({ bookingId: "", amount: "", type: "EXTRA", method: "CASH" });
    loadData();
  }

  const totalIncome = summary.reduce((acc, s) => acc + (s._sum.amount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">收银管理</h2>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Wallet className="w-4 h-4" />
            记账
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">今日总收入</p>
          <p className="text-2xl font-bold text-green-600">¥{totalIncome.toFixed(2)}</p>
        </div>
        {summary.map((s) => (
          <div key={s.method} className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-500">{methodLabels[s.method]}</p>
            <p className="text-2xl font-bold">¥{(s._sum.amount || 0).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Type breakdown */}
      {totalByType.length > 0 && (
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <h3 className="font-semibold mb-3">费用分类</h3>
          <div className="flex gap-6">
            {totalByType.map((t) => (
              <div key={t.type}>
                <span className="text-sm text-gray-500">{typeLabels[t.type]}</span>
                <p className="text-lg font-semibold">¥{(t._sum.amount || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment records */}
      <div className="bg-white rounded-lg shadow">
        <h3 className="font-semibold p-5 border-b">收支记录</h3>
        {payments.length === 0 ? (
          <p className="p-8 text-center text-gray-400">暂无记录</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">时间</th>
                <th className="text-left p-3">客人</th>
                <th className="text-left p-3">房型</th>
                <th className="text-left p-3">类型</th>
                <th className="text-left p-3">方式</th>
                <th className="text-right p-3">金额</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{format(new Date(p.createdAt), "HH:mm")}</td>
                  <td className="p-3">{p.booking?.guestName || "-"}</td>
                  <td className="p-3">{p.booking?.roomType?.name || "-"}</td>
                  <td className="p-3">{typeLabels[p.type]}</td>
                  <td className="p-3">{methodLabels[p.method]}</td>
                  <td className="p-3 text-right font-medium">
                    <span className={p.type === "REFUND" ? "text-red-600" : "text-green-600"}>
                      {p.type === "REFUND" ? "-" : "+"}¥{p.amount.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New payment modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">记一笔</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">关联订单</label>
                <select
                  value={newPayment.bookingId}
                  onChange={(e) => setNewPayment({ ...newPayment, bookingId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">请选择订单</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.guestName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">费用类型</label>
                  <select
                    value={newPayment.type}
                    onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">支付方式</label>
                  <select
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {Object.entries(methodLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">金额</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  取消
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
