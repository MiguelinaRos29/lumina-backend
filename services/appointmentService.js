// services/appointmentService.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Crea cita en BD
 * @param {string} clientId
 * @param {Date} fecha
 * @param {string|null} proposito
 */
async function createAppointment(clientId, fecha, proposito = null) {
  if (!clientId) throw new Error("clientId requerido");
  if (!(fecha instanceof Date) || isNaN(fecha)) throw new Error("Fecha inválida");

  return prisma.appointment.create({
    data: {
      clientId,
      fecha, // DateTime
      status: "confirmed",
      proposito: proposito || null,
    },
  });
}

module.exports = { createAppointment };
