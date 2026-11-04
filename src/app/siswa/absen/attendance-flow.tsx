"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, LoaderCircle, MapPin, TriangleAlert, WifiOff } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { extractToken } from "@/lib/attendance/rules";
import { getPosition, type Position } from "@/lib/client/geolocation";
import { submitAttendance, type AttendanceResult } from "./actions";
import { QrScanner } from "./qr-scanner";

type State =
  | { step: "scan"; note?: string }
  | { step: "locating"; token: string }
  | { step: "submitting"; token: string }
  | { step: "result"; token: string; position: Position; result: AttendanceResult }
  | { step: "location_error"; token: string; message: string }
  | { step: "network_error"; token: string; position: Position; mode: "auto" | "checkout" };

/** Posisi yang lebih tua dari ini diambil ulang sebelum dikirim. */
const POSITION_MAX_AGE_MS = 2 * 60 * 1000;

export function AttendanceFlow({ initialToken }: { initialToken?: string }) {
  const [state, setState] = useState<State>(() => {
    const token = initialToken ? extractToken(initialToken) : null;
    return token ? { step: "locating", token } : { step: "scan" };
  });
  const busy = useRef(false);

  const send = useCallback(
    async (token: string, mode: "auto" | "checkout", reuse?: Position) => {
      if (busy.current) return;
      busy.current = true;
      try {
        let position = reuse && Date.now() - reuse.takenAt < POSITION_MAX_AGE_MS ? reuse : undefined;
        if (!position) {
          setState({ step: "locating", token });
          try {
            position = await getPosition();
          } catch (e) {
            setState({ step: "location_error", token, message: (e as Error).message });
            return;
          }
        }
        setState({ step: "submitting", token });
        try {
          const result = await submitAttendance({
            token,
            mode,
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy,
          });
          setState({ step: "result", token, position, result });
          // Hapus token dari alamat agar refresh halaman tidak mengirim ulang.
          if (window.location.search) window.history.replaceState(null, "", "/siswa/absen");
        } catch {
          // Gagal terkirim (koneksi putus/server tidak terjangkau): simpan posisi agar bisa dicoba ulang (NFR-04).
          setState({ step: "network_error", token, position, mode });
        }
      } finally {
        busy.current = false;
      }
    },
    [],
  );

  // Dibuka dari link QR (aplikasi kamera HP): langsung ambil lokasi dan kirim.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (state.step === "locating") void send(state.token, "auto");
  }, [send, state]);

  const onScan = useCallback(
    (text: string) => {
      const token = extractToken(text);
      if (!token) {
        setState({ step: "scan", note: "QR Code ini bukan QR absensi. Pindai QR yang ditampilkan guru." });
        return;
      }
      void send(token, "auto");
    },
    [send],
  );

  // Antrean kirim ulang (NFR-04): saat koneksi kembali, absensi yang gagal langsung dikirim lagi.
  useEffect(() => {
    if (state.step !== "network_error") return;
    const retry = () => void send(state.token, state.mode, state.position);
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [send, state]);

  const scanAgain = () => setState({ step: "scan" });

  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      {state.step === "scan" && (
        <>
          <p className="text-sm text-muted-foreground">Arahkan kamera ke QR Code yang ditampilkan guru di kelas.</p>
          {state.note && <p className="text-sm text-destructive">{state.note}</p>}
          <QrScanner onScan={onScan} />
        </>
      )}

      {(state.step === "locating" || state.step === "submitting") && (
        <StatusCard icon={<LoaderCircle className="size-10 animate-spin" />} title={state.step === "locating" ? "Mencari lokasi Anda..." : "Mengirim absensi..."}>
          {state.step === "locating" && "Izinkan akses lokasi jika diminta. Proses ini bisa memakan waktu beberapa detik."}
        </StatusCard>
      )}

      {state.step === "location_error" && (
        <StatusCard icon={<MapPin className="size-10 text-destructive" />} title="Lokasi tidak terbaca" tone="error">
          {state.message}
          <Actions>
            <Button onClick={() => send(state.token, "auto")}>Coba lagi</Button>
            <Button variant="outline" onClick={scanAgain}>Scan ulang</Button>
          </Actions>
        </StatusCard>
      )}

      {state.step === "network_error" && (
        <StatusCard icon={<WifiOff className="size-10 text-destructive" />} title="Absensi gagal terkirim" tone="error">
          Koneksi internet terputus atau server tidak bisa dihubungi. Absensi Anda <strong>belum</strong> tercatat. Biarkan halaman ini terbuka: absensi dikirim ulang otomatis saat koneksi kembali, atau tekan Coba lagi.
          <Actions>
            <Button onClick={() => send(state.token, state.mode, state.position)}>Coba lagi</Button>
          </Actions>
        </StatusCard>
      )}

      {state.step === "result" && <ResultView state={state} onCheckout={() => send(state.token, "checkout", state.position)} onRetry={() => send(state.token, "auto")} onScanAgain={scanAgain} />}
    </div>
  );
}

function ResultView({
  state,
  onCheckout,
  onRetry,
  onScanAgain,
}: {
  state: Extract<State, { step: "result" }>;
  onCheckout: () => void;
  onRetry: () => void;
  onScanAgain: () => void;
}) {
  const r = state.result;
  const home = (
    <Link href="/siswa" className={buttonVariants({ variant: "outline" })}>
      Kembali ke beranda
    </Link>
  );

  switch (r.kind) {
    case "checked_in":
      return (
        <StatusCard icon={<CheckCircle2 className="size-12 text-primary" />} title={r.status === "HADIR" ? "Absen masuk berhasil" : "Absen masuk berhasil (Terlambat)"} tone={r.status === "HADIR" ? "success" : "warning"}>
          {r.subject}, tercatat pukul <strong>{r.time}</strong>. Status: <strong>{r.status === "HADIR" ? "Hadir" : "Terlambat"}</strong>.
          <CheckoutReminder at={r.checkoutOpensAt} />
          <Actions>{home}</Actions>
        </StatusCard>
      );
    case "already_checked_in":
      return (
        <StatusCard icon={<CheckCircle2 className="size-12 text-primary" />} title="Anda sudah tercatat hadir" tone="success">
          {r.subject}, absen masuk pukul <strong>{r.time}</strong>.
          <CheckoutReminder at={r.checkoutOpensAt} />
          <Actions>{home}</Actions>
        </StatusCard>
      );
    case "checkout_not_yet":
      return (
        <StatusCard icon={<Clock className="size-12 text-muted-foreground" />} title="Belum waktunya absen selesai">
          {r.subject}, absen masuk pukul <strong>{r.checkInTime}</strong>. Absen selesai bisa dilakukan mulai pukul{" "}
          <strong>{r.checkoutOpensAt}</strong>. Scan QR yang sama lagi pada jam tersebut.
          <Actions>{home}</Actions>
        </StatusCard>
      );
    case "confirm_checkout":
      return (
        <StatusCard icon={<CheckCircle2 className="size-12 text-primary" />} title="Absen selesai pelajaran">
          {r.subject}, absen masuk pukul <strong>{r.checkInTime}</strong>. Lakukan absen selesai sekarang?
          <Actions>
            <Button onClick={onCheckout}>Ya, absen selesai</Button>
            {home}
          </Actions>
        </StatusCard>
      );
    case "checked_out":
      return (
        <StatusCard icon={<CheckCircle2 className="size-12 text-primary" />} title="Absen selesai berhasil" tone="success">
          {r.subject}, tercatat pukul <strong>{r.time}</strong>.
          <Actions>{home}</Actions>
        </StatusCard>
      );
    case "error":
      return (
        <StatusCard icon={<TriangleAlert className="size-10 text-destructive" />} title="Absensi ditolak" tone="error">
          {r.message}
          <Actions>
            {r.retry === "location" && <Button onClick={onRetry}>Coba lagi</Button>}
            {r.retry === "scan" && <Button onClick={onScanAgain}>Scan ulang</Button>}
            {home}
          </Actions>
        </StatusCard>
      );
  }
}

function CheckoutReminder({ at }: { at: string }) {
  return (
    <p className="rounded-lg bg-muted p-3">
      Jangan lupa <strong>absen selesai</strong> mulai pukul <strong>{at}</strong> dengan scan QR yang sama. Siswa yang tidak absen
      selesai akan ditandai di laporan.
    </p>
  );
}

function StatusCard({
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone?: "success" | "warning" | "error";
  children?: React.ReactNode;
}) {
  const border =
    tone === "success" ? "border-primary/40" : tone === "warning" ? "border-amber-500/60" : tone === "error" ? "border-destructive/50" : "";
  return (
    <section className={`flex flex-col items-center gap-3 rounded-xl border p-6 text-center ${border}`} data-testid="attendance-status">
      {icon}
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex flex-col items-center gap-4 text-sm">{children}</div>
    </section>
  );
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap justify-center gap-2">{children}</div>;
}
