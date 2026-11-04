"use server";

import argon2 from "argon2";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession, getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { ROLE_HOME } from "@/lib/roles";
import { config } from "@/lib/config";
import { loginLockState } from "@/lib/login-throttle";

const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username wajib diisi.")
    .max(50, "Username maksimal 50 karakter."),
  password: z.string().min(1, "Password wajib diisi.").max(200, "Password terlalu panjang."),
});

export type LoginState = {
  message?: string;
  fieldErrors?: { username?: string[]; password?: string[] };
  username?: string;
};

const INVALID_LOGIN = "Username atau password salah.";

// Hash pengganti untuk username yang tidak ada, agar waktu respons tetap mirip
// dan penyerang tidak bisa menebak username mana yang terdaftar.
let dummyHash: Promise<string> | undefined;

/** Waktu login gagal untuk username ini dalam jendela pembatasan, setelah login berhasil terakhir. */
async function recentFailures(username: string, userId: number | undefined) {
  const windowStart = new Date(Date.now() - config.loginLockMinutes * 60_000);
  const lastLogin = userId
    ? await prisma.auditLog.findFirst({
        where: { userId, action: "LOGIN" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      })
    : null;
  const since = lastLogin && lastLogin.createdAt > windowStart ? lastLogin.createdAt : windowStart;

  const rows = await prisma.auditLog.findMany({
    where: { action: "LOGIN_FAILED", createdAt: { gt: since }, detail: { path: ["username"], equals: username } },
    select: { createdAt: true },
  });
  return rows.map((r) => r.createdAt);
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      username: String(formData.get("username") ?? ""),
    };
  }

  const { username, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, role: true, isActive: true, passwordHash: true },
  });

  // Cek kunci sebelum memeriksa password, agar penebakan berhenti total selama dikunci.
  const lock = loginLockState(
    await recentFailures(username, user?.id),
    new Date(),
    config.loginMaxAttempts,
    config.loginLockMinutes,
  );
  if (lock.locked) {
    await logAudit({ userId: user?.id, action: "LOGIN_BLOCKED", detail: { username } });
    return {
      message: `Terlalu banyak percobaan login yang gagal. Coba lagi dalam ${lock.retryAfterMinutes} menit.`,
      username,
    };
  }

  dummyHash ??= argon2.hash("dummy-password-for-timing");
  const passwordOk = await argon2.verify(user?.passwordHash ?? (await dummyHash), password);

  if (!user || !passwordOk) {
    await logAudit({ userId: user?.id, action: "LOGIN_FAILED", detail: { username } });
    return { message: INVALID_LOGIN, username };
  }
  if (!user.isActive) {
    await logAudit({ userId: user.id, action: "LOGIN_FAILED", detail: { username, reason: "inactive" } });
    return { message: "Akun Anda dinonaktifkan. Hubungi Admin TU.", username };
  }

  await createSession({ userId: user.id, role: user.role });
  await logAudit({ userId: user.id, action: "LOGIN" });
  redirect(ROLE_HOME[user.role]);
}

export async function logout() {
  const session = await getSession();
  await deleteSession();
  if (session) await logAudit({ userId: session.userId, action: "LOGOUT" });
  redirect("/login");
}
