// scripts/clearAppointments.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function clearAppointments() {
  console.log("🧹 Borrando todas las citas...");

  try {
    const deleted = await prisma.appointment.deleteMany({});
    console.log(`✔ Listo. Citas eliminadas: ${deleted.count}`);
  } catch (err) {
    console.error("❌ Error al borrar citas:", err);
  } finally {
    await prisma.$disconnect();
  }
}

clearAppointments();
