const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createAppointment = async (req, res) => {
  try {
    const { clientId, date } = req.body;

    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        date: new Date(date),
        status: "confirmed",
      },
    });

    return res.json({
      message: "Cita creada correctamente",
      appointment,
    });

  } catch (error) {
    console.log("❌ Error creando cita:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const { clientId } = req.query;

    const appointments = await prisma.appointment.findMany({
      where: { clientId },
      orderBy: { date: "asc" },
    });

    return res.json(appointments);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.body;

    const updated = await prisma.appointment.update({
      where: { id },
      data: { date: new Date(date) },
    });

    return res.json({
      message: "Cita reprogramada correctamente",
      appointment: updated,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.appointment.delete({
      where: { id },
    });

    return res.json({ message: "Cita cancelada" });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
