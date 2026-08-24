import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astana Local Life",
  description: "阿斯塔纳本地生活服务平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}