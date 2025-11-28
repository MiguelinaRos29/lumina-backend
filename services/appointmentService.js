// services/appointmentService.js

const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const prisma = new PrismaClient();

/**
 * Crear una nueva cita
 * @param {Object} params
 * @param {string} params.clientId
 * @param {string} params.fecha   - "2025-12-01"
 * @param {string} params.hora    - "15:00"
 */
async function crearCita({ clientId, fecha, hora }) {
  try {
    // Generamos un id manualmente porque en la tabla no hay default para id
    const id = randomUUID();

    const result = await prisma.$queryRaw`
      INSERT INTO "Appointment" ("id", "clientId", "fecha", "hora")
      VALUES (${id}, ${clientId}, ${fecha}, ${hora})
      RETURNING *;
    `;

    const nuevaCita = Array.isArray(result) ? result[0] : result;
    return nuevaCita;
  } catch (error) {
    console.error("🔥 Error Prisma al crear cita (RAW):", {
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
  try {
    let result;

    if (clientId) {
      result = await prisma.$queryRaw`
        SELECT * FROM "Appointment"
        WHERE "clientId" = ${clientId}
        ORDER BY "createdAt" ASC;
      `;
    } else {
      result = await prisma.$queryRaw`
        SELECT * FROM "Appointment"
        ORDER BY "createdAt" ASC;
      `;
    }

    return result;
  } catch (error) {
    console.error("🔥 Error Prisma al obtener citas (RAW):", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    throw error;
  }
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
  try {
    const campos = [];
    if (fecha) campos.push(`"fecha" = $2`);
    if (hora) campos.push(`"hora" = $3`);
    if (status) campos.push(`"status" = $4`);

    if (campos.length === 0) return null;

    const setClause = campos.join(", ");

    const query = `
      UPDATE "Appointment"
      SET ${setClause}
      WHERE "id" = $1
      RETURNING *;
    `;

    const params = [id, fecha, hora, status].filter(v => v !== undefined);

    const result = await prisma.$queryRawUnsafe(query, ...params);
    const citaActualizada = Array.isArray(result) ? result[0] : result;

    return citaActualizada;
  } catch (error) {
    console.error("🔥 Error Prisma al actualizar cita (RAW):", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    throw error;
  }
}

/**
 * Eliminar una cita
 * @param {string} id
 */
async function eliminarCita(id) {
  try {
    await prisma.$executeRaw`
      DELETE FROM "Appointment"
      WHERE "id" = ${id};
    `;
  } catch (error) {
    console.error("🔥 Error Prisma al eliminar cita (RAW):", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    throw error;
  }
}

module.exports = {
  crearCita,
  obtenerCitas,
  actualizarCita,
  eliminarCita,
};
