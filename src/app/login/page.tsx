import type { Metadata } from "next";
import { MapPin, MonitorSmartphone, QrCode } from "lucide-react";
import { Brand, BrandMark } from "@/components/brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk | Absensi SMK Putra Perdana",
};

const FEATURES = [
  { icon: QrCode, title: "Scan QR Code", text: "Guru membuka sesi, siswa scan QR di kelas." },
  { icon: MapPin, title: "Validasi lokasi GPS", text: "Absensi hanya sah dari dalam area sekolah." },
  { icon: MonitorSmartphone, title: "Pantau langsung", text: "Sekolah dan orang tua melihat kehadiran terbaru." },
] as const;

export default function LoginPage() {
  return (
    <main className="grid flex-1 lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="bg-dots pointer-events-none absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-3">
          <BrandMark className="bg-white text-primary shadow-none" />
          <div className="leading-tight">
            <p className="font-bold">Absensi Digital</p>
            <p className="text-sm text-primary-foreground/75">SMK Putra Perdana Indonesia</p>
          </div>
        </div>

        <div className="relative flex max-w-md flex-col gap-8">
          <h2 className="text-4xl leading-tight font-bold">Absensi kelas yang cepat, jujur, dan mudah dipantau.</h2>
          <ul className="flex flex-col gap-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="text-sm text-primary-foreground/75">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">Kelompok 7 · Sistem Absensi Digital Siswa</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <Brand className="lg:hidden" subtitle="SMK Putra Perdana Indonesia" />
          <div>
            <h1 className="text-2xl font-bold">Masuk ke akun Anda</h1>
            <p className="mt-1 text-sm text-muted-foreground">Gunakan akun yang diberikan sekolah.</p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
