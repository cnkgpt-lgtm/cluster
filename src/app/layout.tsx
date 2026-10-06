import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RTKu: Aplikasi RT/R Perumahan",
  description: "Kelola iuran, pengumuman, CCTV lingkungan, dan kas RT/R perumahan.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
