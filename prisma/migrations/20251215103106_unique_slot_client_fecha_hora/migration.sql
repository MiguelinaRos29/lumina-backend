/*
  Warnings:

  - A unique constraint covering the columns `[clientId,fecha,hora]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Appointment_clientId_fecha_key";

-- DropIndex
DROP INDEX "Appointment_clientId_idx";

-- DropIndex
DROP INDEX "Appointment_fecha_idx";

-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "fecha" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_clientId_fecha_hora_key" ON "Appointment"("clientId", "fecha", "hora");
