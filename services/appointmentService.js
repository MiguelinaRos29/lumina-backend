// services/appointmentService.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Crear una nueva cita
 * @param {Object} params
 * @param {string} params.clientId
 * @param {string} params.fecha      - por ejemplo "28/01/2025"
 * @param {string} params.hora       - por ejemplo "10:35"
 * @param {number|null} params.duracion
 * @param {string|null} params.proposito
 */
async function crearCita({ clientId, fecha, hora, duracion, proposito }) {
  try {
    const nuevaCita = await prisma.appointment.create({
      data: {
        clientId,
        fecha,
        hora,
        duracion: duracion ?? null,
        proposito: proposito ?? null,
        // status y createdAt usan sus valores por defecto
      },
    });

    return nuevaCita;
  } catch (error) {
    console.error("❌ Error en crearCita (appointmentService):", error);
    throw error;
  }
}

/**
 * Obtener citas (del cliente o todas)
 * @param {string|null} clientId
 */
async function obtenerCitas(clientId) {
  try {
    const where = clientId ? { clientId } : {};

    const citas = await prisma.appointment.findMany({
      where,
      orderBy: [
        { fecha: "asc" },
        { hora: "asc" },
      ],
    });

    return citas;
  } catch (error) {
    console.error("❌ Error en obtenerCitas (appointmentService):", error);
    throw error;
  }
}

/**
 * Actualizar una cita
 * @param {string} id
 * @param {Object} datos
 */
async function actualizarCita(id, datos) {
  try {
    const citaActualizada = await prisma.appointment.update({
      where: { id },
      data: datos,
    });

    return citaActualizada;
  } catch (error) {
    console.error("❌ Error en actualizarCita (appointmentService):", error);
    throw error;
  }
}

/**
 * Eliminar una cita
 * @param {string} id
 */
async function eliminarCita(id) {
  try {
    await prisma.appointment.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    console.error("❌ Error en eliminarCita (appointmentService):", error);
    throw error;
  }
}

module.exports = {
  crearCita,
  obtenerCitas,
  actualizarCita,
  eliminarCita,
};
