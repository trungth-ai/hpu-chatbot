import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

// Font văn bản theo Brand Guideline HPU (tr.9): Montserrat
const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trợ lý HPU",
  description:
    "Trợ lý ảo hướng dẫn sử dụng phần mềm — Trường ĐH Quản lý và Công nghệ Hải Phòng",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={montserrat.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
