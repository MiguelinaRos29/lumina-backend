// services/appointmentService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Crea una nueva cita en la base de datos
 * @param {string} clientId - ID del cliente
 * @param {Date} date - Fecha de la cita (objeto Date de JS)
 * @returns {Promise<object>} - Cita creada
 */
async function createAppointment(clientId, date) {
  if (!clientId) {
    throw new Error("createAppointment: falta clientId");
  }
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error("createAppointment: fecha inválida");
  }

  console.log("🗓 [appointmentService] Creando cita en BD:", {
    clientId,
    date,
  });

  const horaTexto = date.toTimeString().slice(0, 5); // "16:00"
  const fechaTexto = date.toISOString(); // ISO completa

  // 👇 IMPORTANTE: aquí usamos SOLO campos que existen en tu modelo
  const appointment = await prisma.appointment.create({
    data: {
      clientId,
      status: "confirmed",
      fecha: fechaTexto,
      hora: horaTexto,
      // duration y proposito los dejamos opcionales para más adelante
    },
  });

  console.log("✅ [appointmentService] Cita creada:", appointment);

  return appointment;
}

/**
 * Devuelve todas las citas de un cliente
 */
async function getAppointmentsByClient(clientId) {
  if (!clientId) {
    throw new Error("getAppointmentsByClient: falta clientId");
  }

  const appointments = await prisma.appointment.findMany({
    where: { clientId },
    orderBy: { createdAt: "asc" },
  });

  return appointments;
}

module.exports = {
  createAppointment,
  getAppointmentsByClient,
};
