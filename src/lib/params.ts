/** Mengubah segmen URL `[id]` menjadi angka positif, atau `null` jika tidak valid. */
export function parseId(value: string): number | null {
  if (!/^\d{1,9}$/.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
}
