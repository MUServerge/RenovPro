import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@maysterpro.app";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";
  const workerEmail = process.env.SEED_WORKER_EMAIL ?? "worker@maysterpro.app";
  const workerPassword = process.env.SEED_WORKER_PASSWORD ?? "worker1234";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "admin",
      locale: "uk",
    },
  });

  const worker = await prisma.user.upsert({
    where: { email: workerEmail },
    update: {},
    create: {
      name: "Ivan",
      email: workerEmail,
      passwordHash: await bcrypt.hash(workerPassword, 10),
      role: "worker",
      hourlyRate: 12.5,
      position: "Builder",
      locale: "uk",
    },
  });

  // A couple of demo entries for the worker, only if none exist yet.
  const existing = await prisma.workEntry.count({ where: { userId: worker.id } });
  if (existing === 0) {
    await prisma.workEntry.createMany({
      data: [
        { userId: worker.id, date: new Date("2026-06-02"), hours: 8, address: "Rambouillet" },
        { userId: worker.id, date: new Date("2026-06-03"), hours: 7.5, address: "Rambouillet" },
        { userId: worker.id, date: new Date("2026-06-04"), hours: 9, address: "Versailles" },
      ],
    });
    await prisma.payment.create({
      data: { userId: worker.id, date: new Date("2026-06-05"), amount: 200 },
    });
  }

  console.log("Seeded:");
  console.log(`  admin  → ${admin.email} / ${adminPassword}`);
  console.log(`  worker → ${worker.email} / ${workerPassword}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
