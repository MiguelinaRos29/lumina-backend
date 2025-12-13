// services/appointmentService.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Convierte Date -> "HH:MM" (hora local del servidor)
 */
function toHoraTexto(date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Crea una cita en la BD
 * @param {string} clientId
 * @param {Date} fecha  DateTime real (con hora)
 * @param {string|null} proposito
 */
async function createAppointment(clientId, fecha, proposito = null) {
  if (!clientId) throw new Error("clientId requerido en createAppointment");

  if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
    throw new Error("Fecha inválida en createAppointment");
  }

  const hora = toHoraTexto(fecha);

  const appointment = await prisma.appointment.create({
    data: {
      clientId,
      fecha,
      hora, // ✅ SIEMPRE presente (evita 'Argument hora is missing')
      status: "confirmed",
      proposito: proposito ?? null,
    },
  });

  return appointment;
}

module.exports = { createAppointment };
