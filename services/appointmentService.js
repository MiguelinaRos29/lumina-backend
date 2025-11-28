// services/appointmentService.js

const { PrismaClient } = require("@prisma/client");
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
    // Insertamos en la tabla "Appointment" usando SQL crudo
    const result = await prisma.$queryRaw`
      INSERT INTO "Appointment" ("clientId", "fecha", "hora")
      VALUES (${clientId}, ${fecha}, ${hora})
      RETURNING *;
    `;

    // $queryRaw suele devolver un array de filas
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
    // Construimos dinámicamente el UPDATE
    const campos = [];
    if (fecha) campos.push(`"fecha" = ${fecha}`);
    if (hora) campos.push(`"hora" = ${hora}`);
    if (status) campos.push(`"status" = ${status}`);

    if (campos.length === 0) {
      return null;
    }

    // OJO: usamos $executeRaw`...` con parámetros, no concatenación peligrosa
    const setClause = campos.join(", ");

    const query = `
      UPDATE "Appointment"
      SET ${setClause}
      WHERE "id" = $1
      RETURNING *;
    `;

    const result = await prisma.$queryRawUnsafe(query, id);
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
