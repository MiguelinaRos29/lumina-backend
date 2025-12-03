// controllers/appointmentController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Crear una cita (por si la usamos fuera del chat)
 */
async function createAppointment(clientId, date) {
  return prisma.appointment.create({
    data: {
      clientId,
      date,
      status: "confirmed",
    },
  });
}

/**
 * Controlador para listar citas de un clientId
 * GET /api/appointments?clientId=XXX
 */
async function listAppointments(req, res) {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: "El parámetro clientId es obligatorio." });
    }

    const appointments = await prisma.appointment.findMany({
      where: { clientId },
      orderBy: { date: "asc" },
    });

    return res.json({ appointments });
  } catch (error) {
    console.error("Error al listar citas:", error);
    return res.status(500).json({ error: "Error al obtener las citas." });
  }
}

module.exports = {
  createAppointment,
  listAppointments,
};
