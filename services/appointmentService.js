// services/appointmentService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Convierte un Date a "HH:MM" en hora local (para mostrar).
 */
function toHoraTexto(date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Normaliza y limpia un Date:
 * - segundos = 0
 * - milisegundos = 0
 */
function limpiarDate(d) {
  if (!(d instanceof Date) || isNaN(d)) throw new Error("Fecha inválida (Date)");
  const date = new Date(d.getTime());
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

function validarHora(hh, mm) {
  if (!Number.isInteger(hh) || !Number.isInteger(mm)) return false;
  if (hh < 0 || hh > 23) return false;
  if (mm < 0 || mm > 59) return false;
  return true;
}

/**
 * Acepta:
 * - Date  (ya con fecha+hora)
 * - { fecha: "YYYY-MM-DD", hora: "HH:MM" }  -> lo convertimos a Date LOCAL
 *
 * Devuelve:
 * - { date: Date, horaTexto: "HH:MM" }
 */
function normalizeAppointmentInput(input) {
  // Caso 1: Date
  if (input instanceof Date) {
    const date = limpiarDate(input);
    return { date, horaTexto: toHoraTexto(date) };
  }

  // Caso 2: {fecha, hora}
  if (
    input &&
    typeof input === "object" &&
    typeof input.fecha === "string" &&
    typeof input.hora === "string"
  ) {
    const fecha = input.fecha.trim();
    const hora = input.hora.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new Error("Formato de fecha inválido. Esperado YYYY-MM-DD");
    }
    if (!/^\d{2}:\d{2}$/.test(hora)) {
      throw new Error("Formato de hora inválido. Esperado HH:MM");
    }

    const [yyyy, mm, dd] = fecha.split("-").map((v) => parseInt(v, 10));
    const [hh, min] = hora.split(":").map((v) => parseInt(v, 10));

    if (!validarHora(hh, min)) {
      throw new Error("Hora inválida. Rango válido: 00:00 a 23:59");
    }

    // Date LOCAL (evita problema UTC)
    const date = new Date(yyyy, mm - 1, dd, hh, min, 0, 0);
    if (isNaN(date)) throw new Error("No se pudo construir Date desde {fecha,hora}");

    return { date: limpiarDate(date), horaTexto: hora };
  }

  throw new Error("Entrada inválida para cita (se esperaba Date o {fecha,hora})");
}

/**
 * Crea una cita en la BD con tu modelo:
 *   fecha: DateTime (real)
 *   hora:  String "HH:MM" (mostrar)
 *
 * Anti-duplicados robusto:
 * - busca existente por (clientId, fecha exacta)
 * - si hay constraint @@unique([clientId, fecha]) y entra doble request, captura P2002
 */
async function createAppointment(clientId, dateOrParsed, proposito = null) {
  if (!clientId) throw new Error("clientId requerido");

  const { date, horaTexto } = normalizeAppointmentInput(dateOrParsed);

  // 1) Intentar encontrar si ya existe
  const existente = await prisma.appointment.findFirst({
    where: { clientId, fecha: date },
  });
  if (existente) return existente;

  // 2) Crear (y si hay carrera, manejar unique)
  try {
    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        fecha: date,       // DateTime real (local)
        hora: horaTexto,   // string para mostrar
        status: "confirmed",
        proposito: proposito || null,
      },
    });

    return appointment;
  } catch (e) {
    // Prisma: Unique constraint failed
    if (e && e.code === "P2002") {
      const ya = await prisma.appointment.findFirst({
        where: { clientId, fecha: date },
      });
      if (ya) return ya;
    }
    throw e;
  }
}

async function getAppointmentsByClient(clientId) {
  if (!clientId) throw new Error("clientId requerido");

  return prisma.appointment.findMany({
    where: { clientId },
    orderBy: [{ fecha: "asc" }],
  });
}

module.exports = {
  createAppointment,
  getAppointmentsByClient,
  normalizeAppointmentInput,
  // helpers (por si luego haces tests)
  limpiarDate,
  toHoraTexto,
};
