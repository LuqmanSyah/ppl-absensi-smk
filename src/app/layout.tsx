import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Plus Jakarta Sans: huruf sans-serif karya desainer Indonesia, jelas dibaca di layar HP.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Absensi SMK Putra Perdana",
  description: "Sistem absensi digital siswa berbasis QR Code dan GPS",
  applicationName: "Absensi SMK",
  appleWebApp: { capable: true, title: "Absensi SMK", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1e59cd",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
