import type { MetadataRoute } from "next";

// Web App Manifest (S3-08): aplikasi bisa dipasang ke layar utama HP seperti aplikasi biasa.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Absensi Digital SMK Putra Perdana",
    short_name: "Absensi SMK",
    description: "Absensi siswa dengan QR Code dan validasi lokasi GPS.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#171717",
    lang: "id",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
