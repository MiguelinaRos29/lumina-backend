// services/appointmentService.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function crearCitaParaCliente(clientId, date) {
  const appointment = await prisma.appointment.create({
    data: {
      clientId,
      date,
      status: "confirmed",
    },
  });

  return appointment;
}

async function listarCitasDeCliente(clientId) {
  const citas = await prisma.appointment.findMany({
    where: { clientId },
    orderBy: { date: "asc" },
  });

  return citas;
}

module.exports = {
  crearCitaParaCliente,
  listarCitasDeCliente,
};
