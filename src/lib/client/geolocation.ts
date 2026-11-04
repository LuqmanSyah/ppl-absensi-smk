// Membaca posisi GPS di browser. Dipakai saat absen dan saat pemantauan berkala.

export type Position = { latitude: number; longitude: number; accuracy: number; takenAt: number };

export function getPosition(): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext || !navigator.geolocation) {
      reject(new Error("Lokasi hanya bisa dibaca lewat HTTPS. Buka aplikasi lewat alamat https://."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracy: p.coords.accuracy,
          takenAt: Date.now(),
        }),
      (err) => {
        const messages: Record<number, string> = {
          1: "Izin lokasi ditolak. Buka pengaturan browser, izinkan akses lokasi untuk situs ini, lalu coba lagi.",
          2: "Lokasi tidak tersedia. Pastikan GPS/lokasi di HP sudah aktif.",
          3: "Terlalu lama mencari lokasi. Pindah ke dekat jendela atau tempat terbuka, lalu coba lagi.",
        };
        reject(new Error(messages[err.code] ?? "Gagal membaca lokasi."));
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    );
  });
}
