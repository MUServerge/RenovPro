-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'worker');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'on_leave', 'terminated');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('create', 'update', 'delete');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'worker',
    "photoUrl" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "birthDate" TIMESTAMP(3),
    "nationality" TEXT,
    "startDate" TIMESTAMP(3),
    "emergencyContact" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "position" TEXT,
    "notes" TEXT,
    "hourlyRate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "locale" TEXT NOT NULL DEFAULT 'uk',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hours" DECIMAL(6,2) NOT NULL,
    "address" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "work_entries_userId_date_idx" ON "work_entries"("userId", "date");

-- CreateIndex
CREATE INDEX "payments_userId_date_idx" ON "payments"("userId", "date");

-- CreateIndex
CREATE INDEX "audit_log_tableName_recordId_idx" ON "audit_log"("tableName", "recordId");

-- AddForeignKey
ALTER TABLE "work_entries" ADD CONSTRAINT "work_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ─────────────────────────────────────────────
-- Seed accounts (passwords: admin1234 / worker1234)
-- locale 'en' => English UI by default
-- ─────────────────────────────────────────────
INSERT INTO "users" ("id","name","email","passwordHash","role","hourlyRate","position","locale")
VALUES
  ('seed_admin_0001','Admin','admin@maysterpro.app','$2a$10$KppYKp0oXuw9R4F1mXjT0Oeu2QNHwb.UVvZs1V6Iv8mgXVVSq5e7m','admin',0,NULL,'en'),
  ('seed_worker_001','Ivan','worker@maysterpro.app','$2a$10$wNAm.8vDcS.YIAnO3oL7pOA66B0SiZhuL2bRlWgifM0cf8pHeQ1TS','worker',12.5,'Builder','en')
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "work_entries" ("id","userId","date","hours","address")
VALUES
  ('seed_we_0001','seed_worker_001','2026-06-02',8,'Rambouillet'),
  ('seed_we_0002','seed_worker_001','2026-06-03',7.5,'Rambouillet'),
  ('seed_we_0003','seed_worker_001','2026-06-04',9,'Versailles')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "payments" ("id","userId","date","amount")
VALUES ('seed_pay_0001','seed_worker_001','2026-06-05',200)
ON CONFLICT ("id") DO NOTHING;
