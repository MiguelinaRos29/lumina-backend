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

    console.log("➡ listAppointments llamado con clientId:", clientId);

    if (!clientId) {
      return res
        .status(400)
        .json({ error: "El parámetro clientId es obligatorio." });
    }

    const appointments = await prisma.appointment.findMany({
      where: { clientId },
      orderBy: { date: "asc" },
    });

    console.log("✅ Citas encontradas:", appointments.length);

    return res.json({ appointments });
  } catch (error) {
    console.error("❌ Error al obtener citas:", error);
    return res.status(500).json({ error: "Error al obtener citas" });
  }
}

module.exports = {
  createAppointment,
  listAppointments,
};
