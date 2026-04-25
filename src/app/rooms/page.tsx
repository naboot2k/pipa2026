"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, PlusCircle, X } from "lucide-react";

interface Room {
  id: string;
  roomNumber: string;
  status: string;
}

interface RoomType {
  id: string;
  name: string;
  price: number;
  weekendPrice: number | null;
  description: string | null;
  totalRooms: number;
  rooms: Room[];
}

const statusLabels: Record<string, string> = {
  AVAILABLE: "空闲",
  OCCUPIED: "已入住",
  RESERVED: "已预订",
  CLEANING: "打扫中",
  MAINTENANCE: "维修中",
};

export default function RoomsPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: "", weekendPrice: "", description: "", totalRooms: "" });
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [newRoomNumber, setNewRoomNumber] = useState("");

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    const res = await fetch("/api/rooms");
    const data = await res.json();
    setRoomTypes(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      await fetch(`/api/rooms/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowModal(false);
    setEditingId(null);
    setForm({ name: "", price: "", weekendPrice: "", description: "", totalRooms: "" });
    fetchRooms();
  }

  function handleEdit(rt: RoomType) {
    setEditingId(rt.id);
    setForm({
      name: rt.name,
      price: String(rt.price),
      weekendPrice: rt.weekendPrice ? String(rt.weekendPrice) : "",
      description: rt.description || "",
      totalRooms: String(rt.totalRooms),
    });
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除此房型？关联的房间和预订也会被删除。")) return;
    await fetch(`/api/rooms/${id}`, { method: "DELETE" });
    fetchRooms();
  }

  async function addRoom(roomTypeId: string) {
    if (!newRoomNumber.trim()) return;
    await fetch(`/api/rooms/${roomTypeId}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomNumber: newRoomNumber }),
    });
    setNewRoomNumber("");
    fetchRooms();
  }

  async function deleteRoom(roomId: string) {
    if (!confirm("确定删除此房间？")) return;
    await fetch(`/api/rooms/rooms/${roomId}`, { method: "DELETE" });
    fetchRooms();
  }

  async function updateRoomStatus(roomId: string, status: string) {
    await fetch(`/api/rooms/rooms/${roomId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchRooms();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">房型管理</h2>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ name: "", price: "", weekendPrice: "", description: "", totalRooms: "" });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          新增房型
        </button>
      </div>

      <div className="space-y-4">
        {roomTypes.map((rt) => (
          <div key={rt.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex items-center justify-between p-5">
              <div>
                <h3 className="text-lg font-semibold">{rt.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  平日 ¥{rt.price.toFixed(2)}
                  {rt.weekendPrice && ` / 周末 ¥${rt.weekendPrice.toFixed(2)}`}
                  {rt.description && ` · ${rt.description}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExpandedType(expandedType === rt.id ? null : rt.id)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {rt.rooms.length} 间房 {expandedType === rt.id ? "▲" : "▼"}
                </button>
                <button onClick={() => handleEdit(rt)} className="p-1.5 hover:bg-gray-100 rounded">
                  <Edit className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={() => handleDelete(rt.id)} className="p-1.5 hover:bg-gray-100 rounded">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>

            {expandedType === rt.id && (
              <div className="border-t p-4 bg-gray-50">
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    placeholder="房间号（如 101）"
                    className="border rounded-lg px-3 py-1.5 text-sm w-32"
                  />
                  <button
                    onClick={() => addRoom(rt.id)}
                    className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700"
                  >
                    <PlusCircle className="w-4 h-4" />
                    添加房间
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {rt.rooms.map((room) => (
                    <div key={room.id} className="bg-white rounded-lg border p-3 text-center">
                      <p className="font-semibold text-lg">{room.roomNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">{statusLabels[room.status]}</p>
                      <select
                        value={room.status}
                        onChange={(e) => updateRoomStatus(room.id, e.target.value)}
                        className="mt-1 text-xs border rounded px-1 py-0.5 w-full"
                      >
                        <option value="AVAILABLE">空闲</option>
                        <option value="OCCUPIED">已入住</option>
                        <option value="RESERVED">已预订</option>
                        <option value="CLEANING">打扫中</option>
                        <option value="MAINTENANCE">维修中</option>
                      </select>
                      <button
                        onClick={() => deleteRoom(room.id)}
                        className="mt-1 text-xs text-red-400 hover:text-red-600"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {roomTypes.length === 0 && (
          <p className="text-center text-gray-400 py-12">暂无房型，请先添加</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingId ? "编辑房型" : "新增房型"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">房型名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">平日价格</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">周末价格（可选）</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.weekendPrice}
                    onChange={(e) => setForm({ ...form, weekendPrice: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">房间总数</label>
                <input
                  type="number"
                  value={form.totalRooms}
                  onChange={(e) => setForm({ ...form, totalRooms: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 h-20"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">
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
