// controllers/appointmentController.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Convierte un Date (o string de fecha) a { fecha, hora }
 * fecha: "dd/MM/yyyy"
 * hora : "HH:mm"
 */
function parseToFechaHora(dateInput) {
  if (!dateInput) return { fecha: null, hora: null };

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return { fecha: null, hora: null };

  const pad = (n) => (n < 10 ? "0" + n : "" + n);

  const fecha = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  return { fecha, hora };
}

// =======================
// Crear cita (REST / API)
// =======================

const createAppointment = async (req, res) => {
  try {
    const {
      clientId,
      // formato alternativo: fecha/hora ya calculados
      fecha,
      hora,
      duracion,
      proposito,
      status,
      // formato alternativo: date único (ISO) desde el chat / frontend
      date,
    } = req.body;

    if (!clientId) {
      return res
        .status(400)
        .json({ error: "clientId es obligatorio" });
    }

    // Normalizamos fecha/hora
    let finalFecha = fecha || null;
    let finalHora = hora || null;

    if ((!finalFecha || !finalHora) && date) {
      const parsed = parseToFechaHora(date);
      if (parsed.fecha && parsed.hora) {
        finalFecha = finalFecha || parsed.fecha;
        finalHora  = finalHora || parsed.hora;
      }
    }

    if (!finalFecha || !finalHora) {
      return res.status(400).json({
        error:
          "Debes proporcionar fecha y hora (ya sea como campos separados o a partir de un 'date').",
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        fecha: finalFecha,
        hora: finalHora,
        duracion: typeof duracion === "number" ? duracion : null,
        proposito: proposito || null,
        status: status || "confirmed",
      },
    });

    return res.status(201).json({ appointment });
  } catch (error) {
    console.error("❌ Error en createAppointment:", error);
    return res.status(500).json({
      error: "Error al crear la cita",
      details: error.message,
    });
  }
};

// =======================
// Listar citas
// GET /api/appointments?clientId=...
// =======================

// Listar citas
// GET /api/appointments?clientId=...
const getAppointments = async (req, res) => {
  try {
    const { clientId } = req.query;

    const where = {};
    if (clientId) where.clientId = clientId;

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { createdAt: "asc" }, // 👈 aquí ya no usamos "date"
    });

    // Adaptamos fecha + hora a un campo "date" para la app móvil
    const mapped = appointments.map((a) => {
      let isoDate = null;
      try {
        if (a.fecha && a.hora) {
          const [d, m, y] = a.fecha.split("/"); // "05/12/2025"
          isoDate = new Date(`${y}-${m}-${d}T${a.hora}:00`);
        }
      } catch (e) {
        // si falla, isoDate se queda en null
      }

      return {
        ...a,
        date: isoDate, // 👈 campo que la app usa como Date
      };
    });

    // 👇 IMPORTANTE: volvemos al formato que espera la app
    return res.json({ appointments: mapped });
  } catch (error) {
    console.error("❌ Error en getAppointments:", error);
    return res.status(500).json({
      error: "Error al obtener las citas",
      details: error.message,
    });
  }
};

// =======================
// Actualizar cita
// PUT /api/appointments/:id
// =======================

const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fecha,
      hora,
      duracion,
      proposito,
      status,
      date, // opcional: si te mandan una nueva fecha/hora en un solo campo
    } = req.body;

    const data = {};

    let finalFecha = fecha || null;
    let finalHora = hora || null;

    if ((!finalFecha || !finalHora) && date) {
      const parsed = parseToFechaHora(date);
      if (parsed.fecha && parsed.hora) {
        finalFecha = finalFecha || parsed.fecha;
        finalHora  = finalHora || parsed.hora;
      }
    }

    if (finalFecha) data.fecha = finalFecha;
    if (finalHora) data.hora = finalHora;

    if (typeof duracion === "number") data.duracion = duracion;
    if (proposito) data.proposito = proposito;
    if (status) data.status = status;

    const updated = await prisma.appointment.update({
      where: { id },
      data,
    });

    return res.json({ appointment: updated });
  } catch (error) {
    console.error("❌ Error en updateAppointment:", error);
    return res.status(500).json({
      error: "Error al actualizar la cita",
      details: error.message,
    });
  }
};

// =======================
// Eliminar cita
// DELETE /api/appointments/:id
// =======================

const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.appointment.delete({
      where: { id },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("❌ Error en deleteAppointment:", error);
    return res.status(500).json({
      error: "Error al eliminar la cita",
      details: error.message,
    });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment,
};
