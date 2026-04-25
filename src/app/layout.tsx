import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "枇杷树下民宿 - 前台管理系统",
  description: "民宿前台管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} antialiased`}>
      <body className="min-h-full bg-gray-50">
        <Sidebar />
        <main className="ml-56 p-6">{children}</main>
      </body>
    </html>
  );
}
