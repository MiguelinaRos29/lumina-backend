// services/appointmentService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Crea una cita en la base de datos.
 * @param {string} clientId
 * @param {Date} date
 * @param {string|null} proposito
 */
async function createAppointment(clientId, date, proposito = null) {
  if (!clientId) throw new Error("clientId requerido");

  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error("Fecha inválida en createAppointment");
  }

  // ✅ Guardado estable (evita líos de zona horaria)
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const fecha = `${yyyy}-${mm}-${dd}`;

  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const hora = `${hh}:${mi}`;

  const cleanPurpose =
    typeof proposito === "string" && proposito.trim().length > 0
      ? proposito.trim().slice(0, 140)
      : null;

  // ✅ Si tu prisma tiene proposito como String? (opcional), esto funciona perfecto
  const created = await prisma.appointment.create({
    data: {
      clientId,
      fecha,
      hora,
      status: "confirmed",
      proposito: cleanPurpose,
    },
  });

  return created;
}

module.exports = { createAppointment };
