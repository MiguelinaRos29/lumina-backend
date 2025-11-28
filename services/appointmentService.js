// services/appointmentService.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Crear una nueva cita
 * @param {Object} params
 * @param {string} params.clientId  - ID del cliente
 * @param {string} params.fecha     - "2025-12-01"
 * @param {string} params.hora      - "15:00"
 */
async function crearCita({ clientId, fecha, hora }) {
  try {
    // Construimos un objeto Date a partir de fecha + hora
    const [year, month, day] = fecha.split("-").map(Number); // "2025-12-01"
    const [hour, minute] = hora.split(":").map(Number);      // "15:00"

    const date = new Date(year, month - 1, day, hour, minute);

    const nuevaCita = await prisma.appointment.create({
      data: {
        clientId,
        date, // 👈 campo real del modelo Prisma
        // status usará el default "confirmed"
      },
    });

    return nuevaCita;
  } catch (error) {
    console.error("🔥 Error Prisma al crear cita:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    throw error;
  }
}

/**
 * Obtener citas de un cliente (o todas si no se pasa clientId)
 */
async function obtenerCitas(clientId) {
  const where = clientId ? { clientId } : {};

  return prisma.appointment.findMany({
    where,
    orderBy: { date: "asc" },
  });
}

/**
 * Actualizar una cita
 * @param {string} id
 * @param {Object} datos
 * @param {string} [datos.fecha]
 * @param {string} [datos.hora]
 * @param {string} [datos.status]
 */
async function actualizarCita(id, { fecha, hora, status }) {
  const data = {};

  if (fecha && hora) {
    const [year, month, day] = fecha.split("-").map(Number);
    const [hourPart, minute] = hora.split(":").map(Number);
    data.date = new Date(year, month - 1, day, hourPart, minute);
  }

  if (status) {
    data.status = status;
  }

  const citaActualizada = await prisma.appointment.update({
    where: { id },
    data,
  });

  return citaActualizada;
}

/**
 * Eliminar una cita
 * @param {string} id
 */
async function eliminarCita(id) {
  await prisma.appointment.delete({
    where: { id },
  });
}

module.exports = {
  crearCita,
  obtenerCitas,
  actualizarCita,
  eliminarCita,
};
