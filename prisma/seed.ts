// Data seed untuk pengembangan. Jalankan: npx prisma db seed
// Password di bawah HANYA untuk development, jangan dipakai di production.
import "dotenv/config";
import argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEV_PASSWORD = "password123";

// Kolom `time` di Prisma memakai DateTime; hanya bagian jamnya yang disimpan.
const time = (hhmm: string) => new Date(`1970-01-01T${hhmm}:00Z`);

async function upsertUser(username: string, role: Role, passwordHash: string) {
  return prisma.user.upsert({
    where: { username },
    update: {},
    create: { username, role, passwordHash },
  });
}

async function main() {
  const passwordHash = await argon2.hash(DEV_PASSWORD);

  // Admin/TU
  const adminUser = await upsertUser("admin", Role.ADMIN, passwordHash);
  await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: { userId: adminUser.id, name: "Admin TU" },
  });

  // Guru dan jadwal
  const teachers = [
    {
      username: "guru1",
      nip: "198501012010011001",
      name: "Budi Santoso",
      schedules: [
        { className: "XI RPL 1", subject: "Pemrograman Web", day: 1, start: "07:00", end: "08:30" },
        { className: "XI RPL 2", subject: "Pemrograman Web", day: 2, start: "09:00", end: "10:30" },
      ],
    },
    {
      username: "guru2",
      nip: "199002022015022002",
      name: "Siti Rahmawati",
      schedules: [
        { className: "XI RPL 1", subject: "Basis Data", day: 3, start: "07:00", end: "08:30" },
      ],
    },
  ];

  for (const t of teachers) {
    const user = await upsertUser(t.username, Role.TEACHER, passwordHash);
    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, nip: t.nip, name: t.name },
    });
    const hasSchedules = await prisma.schedule.count({ where: { teacherId: teacher.id } });
    if (hasSchedules === 0) {
      await prisma.schedule.createMany({
        data: t.schedules.map((s) => ({
          teacherId: teacher.id,
          className: s.className,
          subject: s.subject,
          day: s.day,
          startTime: time(s.start),
          endTime: time(s.end),
        })),
      });
    }
  }

  // Orang tua
  const parentIds: number[] = [];
  for (const p of [
    { username: "ortu1", name: "Ahmad Wijaya" },
    { username: "ortu2", name: "Dewi Lestari" },
  ]) {
    const user = await upsertUser(p.username, Role.PARENT, passwordHash);
    const parent = await prisma.parent.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, name: p.name },
    });
    parentIds.push(parent.id);
  }

  // Siswa (beberapa terhubung ke orang tua)
  const students = [
    { nis: "2024001", name: "Rizky Wijaya", className: "XI RPL 1", parent: 0 },
    { nis: "2024002", name: "Nadia Wijaya", className: "XI RPL 2", parent: 0 },
    { nis: "2024003", name: "Fajar Lestari", className: "XI RPL 1", parent: 1 },
    { nis: "2024004", name: "Putri Ayu", className: "XI RPL 1", parent: null },
    { nis: "2024005", name: "Dimas Pratama", className: "XI RPL 2", parent: null },
    { nis: "2024006", name: "Salsa Amelia", className: "XI RPL 2", parent: null },
  ];
  for (const s of students) {
    const user = await upsertUser(s.nis, Role.STUDENT, passwordHash);
    await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        nis: s.nis,
        name: s.name,
        className: s.className,
        parentId: s.parent === null ? null : parentIds[s.parent],
      },
    });
  }

  // Lokasi sekolah (koordinat contoh, sesuaikan dengan lokasi asli sekolah)
  if ((await prisma.schoolLocation.count()) === 0) {
    await prisma.schoolLocation.create({
      data: {
        name: "SMK Putra Perdana Indonesia",
        latitude: "-6.1751100",
        longitude: "106.8650390",
        radiusM: 100,
      },
    });
  }

  console.log(`Seed selesai. Semua akun memakai password: ${DEV_PASSWORD}`);
  console.log("Akun: admin, guru1, guru2, ortu1, ortu2, siswa 2024001-2024006 (username = NIS)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
