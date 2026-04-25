export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "CLEANING" | "MAINTENANCE";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
export type PaymentType = "ROOM_FEE" | "DEPOSIT" | "MEAL" | "EXTRA" | "REFUND";
export type PaymentMethod = "CASH" | "WECHAT" | "ALIPAY" | "CARD";

export const RoomStatusLabels: Record<RoomStatus, string> = {
  AVAILABLE: "空闲",
  OCCUPIED: "已入住",
  RESERVED: "已预订",
  CLEANING: "打扫中",
  MAINTENANCE: "维修中",
};

export const BookingStatusLabels: Record<BookingStatus, string> = {
  PENDING: "待确认",
  CONFIRMED: "已确认",
  CHECKED_IN: "已入住",
  CHECKED_OUT: "已退房",
  CANCELLED: "已取消",
};

export const PaymentTypeLabels: Record<PaymentType, string> = {
  ROOM_FEE: "房费",
  DEPOSIT: "押金",
  MEAL: "餐费",
  EXTRA: "杂费",
  REFUND: "退款",
};

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "现金",
  WECHAT: "微信",
  ALIPAY: "支付宝",
  CARD: "刷卡",
};

export const RoomStatusColors: Record<RoomStatus, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  OCCUPIED: "bg-blue-100 text-blue-800",
  RESERVED: "bg-yellow-100 text-yellow-800",
  CLEANING: "bg-orange-100 text-orange-800",
  MAINTENANCE: "bg-red-100 text-red-800",
};

export const BookingStatusColors: Record<BookingStatus, string> = {
  PENDING: "bg-gray-100 text-gray-800",
  CONFIRMED: "bg-yellow-100 text-yellow-800",
  CHECKED_IN: "bg-blue-100 text-blue-800",
  CHECKED_OUT: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};
