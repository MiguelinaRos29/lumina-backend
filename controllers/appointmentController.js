// controllers/appointmentController.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Crear cita (REST)
const createAppointment = async (req, res) => {
  try {
    const { clientId, date, status } = req.body;

    if (!clientId || !date) {
      return res
        .status(400)
        .json({ error: "clientId y date son obligatorios" });
    }

    const appointmentDate = new Date(date);

    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        date: appointmentDate,
        status: status || "confirmed",
      },
    });

    return res.status(201).json({ appointment });
  } catch (error) {
    console.error("❌ Error en createAppointment:", error);
    return res
      .status(500)
      .json({ error: "Error al crear la cita", details: error.message });
  }
};

// Listar citas
// GET /api/appointments?clientId=xxxx
const getAppointments = async (req, res) => {
  try {
    const { clientId } = req.query;

    const where = clientId ? { clientId } : {};

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return res.json({ appointments });
  } catch (error) {
    console.error("❌ Error en getAppointments:", error);
    return res.status(500).json({
      error: "Error al obtener las citas",
      details: error.message,
    });
  }
};

// Actualizar cita
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, status } = req.body;

    const data = {};
    if (date) data.date = new Date(date);
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

// Eliminar cita
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
