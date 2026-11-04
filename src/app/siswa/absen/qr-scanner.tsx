"use client";

import { useEffect, useRef, useState } from "react";

const ELEMENT_ID = "qr-reader";

/** Kamera pemindai QR (html5-qrcode). Memanggil onScan sekali untuk setiap teks yang terbaca. */
export function QrScanner({ onScan }: { onScan: (text: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  });

  useEffect(() => {
    let stopped = false;
    let scanner: import("html5-qrcode").Html5Qrcode | undefined;

    (async () => {
      if (!window.isSecureContext || !navigator.mediaDevices) {
        setError("Kamera hanya bisa dipakai lewat HTTPS. Buka aplikasi lewat alamat https://.");
        return;
      }
      const { Html5Qrcode } = await import("html5-qrcode");
      if (stopped) return;
      scanner = new Html5Qrcode(ELEMENT_ID, { verbose: false });
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (text) => onScanRef.current(text),
          () => {},
        );
      } catch {
        if (!stopped) {
          setError(
            "Kamera tidak bisa dibuka. Izinkan akses kamera untuk situs ini di pengaturan browser, atau pindai QR memakai aplikasi kamera HP.",
          );
        }
      }
    })();

    return () => {
      stopped = true;
      if (scanner?.isScanning) scanner.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl bg-muted shadow-sm ring-1 ring-border">
        <div id={ELEMENT_ID} className="aspect-square w-full" />
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
