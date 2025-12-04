// controllers/appointmentController.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ---------------------------------------------------------
// Crear cita (REST)
// POST /api/appointments
// Body esperado:
// { clientId, fecha, hora, duracion?, proposito?, status? }
// ---------------------------------------------------------
const createAppointment = async (req, res) => {
  try {
    const { clientId, fecha, hora, duracion, proposito, status } = req.body;

    if (!clientId || !fecha || !hora) {
      return res.status(400).json({
        error: "clientId, fecha y hora son obligatorios",
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        fecha,
        hora,
        duracion: duracion ?? null,
        proposito: proposito ?? null,
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

// ---------------------------------------------------------
// Listar citas
// GET /api/appointments?clientId=mobile_client_1
// Respuesta: { appointments: [ ... ] }
// Además añadimos un campo "date" (ISO) para la app móvil.
// ---------------------------------------------------------
const getAppointments = async (req, res) => {
  try {
    const { clientId } = req.query;

    // Si quieres, más adelante podemos filtrar por clientId.
    // Por ahora, si viene se usa; si no, se devuelven todas.
    const where = {};
    if (clientId) {
      where.clientId = clientId;
    }

    const appointments = await prisma.appointment.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: { createdAt: "asc" }, // usamos createdAt, que sí existe
    });

    // Adaptamos fecha + hora a un campo "date" ISO legible por JS
    const mapped = appointments.map((a) => {
      let isoDate = null;

      try {
        if (a.fecha && a.hora) {
          // fecha: "05/12/2025"  →  d/m/y
          const [d, m, y] = a.fecha.split("/");

          if (d && m && y) {
            // Construimos: 2025-12-05T19:00:00
            isoDate = new Date(`${y}-${m}-${d}T${a.hora}:00`);
          }
        }
      } catch (e) {
        // si algo falla, isoDate se queda en null
      }

      return {
        ...a,
        date: isoDate, // la app luego hará new Date(item.date)
      };
    });

    return res.json({ appointments: mapped });
  } catch (error) {
    console.error("❌ Error en getAppointments:", error);
    return res.status(500).json({
      error: "Error al obtener las citas",
      details: error.message,
    });
  }
};

// ---------------------------------------------------------
// Actualizar cita
// PUT /api/appointments/:id
// Body: cualquier combinación de { fecha, hora, duracion, proposito, status }
// ---------------------------------------------------------
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, hora, duracion, proposito, status } = req.body;

    if (!id) {
      return res.status(400).json({ error: "id es obligatorio" });
    }

    const data = {};
    if (fecha !== undefined) data.fecha = fecha;
    if (hora !== undefined) data.hora = hora;
    if (duracion !== undefined) data.duracion = duracion;
    if (proposito !== undefined) data.proposito = proposito;
    if (status !== undefined) data.status = status;

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

// ---------------------------------------------------------
// Eliminar cita
// DELETE /api/appointments/:id
// ---------------------------------------------------------
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "id es obligatorio" });
    }

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
  // alias para index.js si usas listAppointments:
  listAppointments: getAppointments,
  updateAppointment,
  deleteAppointment,
};
