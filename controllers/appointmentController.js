// controllers/appointmentController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function fechaToYMD(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function limpiarDate(d) {
  const date = new Date(d.getTime());
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

function toHoraTexto(date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function validarHora(hh, mm) {
  if (!Number.isInteger(hh) || !Number.isInteger(mm)) return false;
  if (hh < 0 || hh > 23) return false;
  if (mm < 0 || mm > 59) return false;
  return true;
}

/**
 * POST /api/appointments
 * body: { clientId, fecha: "YYYY-MM-DD", hora: "HH:MM", proposito? }
 */
async function crearCita(req, res) {
  try {
    const { clientId, fecha, hora, proposito } = req.body;

    if (!clientId) return res.status(400).json({ error: "clientId requerido" });
    if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ error: "fecha inválida (YYYY-MM-DD)" });
    }
    if (typeof hora !== "string" || !/^\d{2}:\d{2}$/.test(hora)) {
      return res.status(400).json({ error: "hora inválida (HH:MM)" });
    }

    const [yyyy, mm, dd] = fecha.split("-").map((v) => parseInt(v, 10));
    const [hh, min] = hora.split(":").map((v) => parseInt(v, 10));
    if (!validarHora(hh, min)) {
      return res.status(400).json({ error: "hora fuera de rango" });
    }

    let date = new Date(yyyy, mm - 1, dd, hh, min, 0, 0);
    if (isNaN(date)) return res.status(400).json({ error: "fecha inválida" });

    date = limpiarDate(date);
    const horaTexto = hora || toHoraTexto(date);

    // anti-duplicado rápido
    const existente = await prisma.appointment.findFirst({
      where: { clientId, fecha: date },
    });
    if (existente) {
      return res.json({
        appointment: {
          id: existente.id,
          clientId: existente.clientId,
          fechaStr: fechaToYMD(existente.fecha),
          hora: existente.hora,
          status: existente.status,
          proposito: existente.proposito,
          createdAt: existente.createdAt,
        },
        alreadyExisted: true,
      });
    }

    // crear (robusto con @@unique([clientId, fecha]))
    let appointment;
    try {
      appointment = await prisma.appointment.create({
        data: {
          clientId,
          fecha: date,
          hora: horaTexto,
          status: "confirmed",
          proposito: proposito || null,
        },
      });
    } catch (e) {
      if (e && e.code === "P2002") {
        const ya = await prisma.appointment.findFirst({
          where: { clientId, fecha: date },
        });
        if (ya) {
          return res.json({
            appointment: {
              id: ya.id,
              clientId: ya.clientId,
              fechaStr: fechaToYMD(ya.fecha),
              hora: ya.hora,
              status: ya.status,
              proposito: ya.proposito,
              createdAt: ya.createdAt,
            },
            alreadyExisted: true,
          });
        }
      }
      throw e;
    }

    return res.json({
      appointment: {
        id: appointment.id,
        clientId: appointment.clientId,
        fechaStr: fechaToYMD(appointment.fecha),
        hora: appointment.hora,
        status: appointment.status,
        proposito: appointment.proposito,
        createdAt: appointment.createdAt,
      },
      alreadyExisted: false,
    });
  } catch (err) {
    console.error("❌ Error crearCita:", err);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: err.message || String(err),
    });
  }
}

/**
 * PUT /api/appointments/:id
 * body: { status?, proposito? }
 */
async function actualizarCita(req, res) {
  try {
    const { id } = req.params;
    const { status, proposito } = req.body;

    if (!id) return res.status(400).json({ error: "id requerido" });

    const data = {};
    if (typeof status === "string") data.status = status;
    if (typeof proposito === "string" || proposito === null) data.proposito = proposito;

    const updated = await prisma.appointment.update({
      where: { id },
      data,
    });

    return res.json({
      appointment: {
        id: updated.id,
        clientId: updated.clientId,
        fechaStr: fechaToYMD(updated.fecha),
        hora: updated.hora,
        status: updated.status,
        proposito: updated.proposito,
        createdAt: updated.createdAt,
      },
    });
  } catch (err) {
    console.error("❌ Error actualizarCita:", err);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: err.message || String(err),
    });
  }
}

/**
 * GET /api/appointments?clientId=...
 */
async function obtenerCitas(req, res) {
  try {
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ error: "clientId requerido" });

    const citas = await prisma.appointment.findMany({
      where: { clientId },
      orderBy: { fecha: "asc" },
    });

    const appointments = citas.map((c) => ({
      id: c.id,
      clientId: c.clientId,
      fechaStr: fechaToYMD(c.fecha),
      hora: c.hora, // ✅ string segura
      status: c.status,
      proposito: c.proposito,
      createdAt: c.createdAt,
    }));

    return res.json({ appointments });
  } catch (err) {
    console.error("❌ Error obtenerCitas:", err);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: err.message || String(err),
    });
  }
}

module.exports = {
  crearCita,
  actualizarCita,
  obtenerCitas,
};


