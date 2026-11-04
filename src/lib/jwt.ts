// Tanda tangan dan verifikasi token sesi (JWT HS256).
// Sengaja tidak bergantung pada `next/headers` agar bisa dipakai juga di proxy.
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/generated/prisma/enums";

export const SESSION_COOKIE = "session";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 jam, satu hari sekolah

export type SessionPayload = {
  userId: number;
  role: Role;
};

function getKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET belum diisi atau terlalu pendek (minimal 32 karakter). Lihat README.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload, expiresAt: Date) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getKey());
}

/** Mengembalikan payload jika token sah dan belum kedaluwarsa, selain itu `null`. */
export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.userId !== "number" || typeof payload.role !== "string") return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}
