// controllers/chatcontroller.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { createAppointment } = require("../services/appointmentService");
const { parseFechaDesdeMensaje } = require("../services/dateParser");
const { detectarIntencion } = require("../services/intentDetection");
const { obtenerRespuestaLumina } = require("../services/luminaAI");

/**
 * Formatea un DateTime a "YYYY-MM-DD" en local.
 */
function dateToFechaStr(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function asegurarCliente(clientId) {
  const existe = await prisma.client.findUnique({ where: { id: clientId } });
  if (existe) return existe;

  return prisma.client.create({
    data: {
      id: clientId,
      name: "Cliente",
      api_key: `temp_${clientId}`, // unique
    },
  });
}

async function guardarMensaje(clientId, role, content) {
  await asegurarCliente(clientId);
  return prisma.message.create({
    data: { client_id: clientId, role, content },
  });
}

/**
 * POST /api/chat
 * body: { clientId, message, mode? }
 */
async function chatcontroller(req, res) {
  try {
    const { clientId, message, mode = null } = req.body;

    if (!clientId) return res.status(400).json({ error: "clientId requerido" });
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message requerido" });
    }

    await guardarMensaje(clientId, "user", message);

    const intencion = detectarIntencion(message);

    // ---- Citas ----
    if (intencion === "CREAR_CITA") {
      const parsedDate = parseFechaDesdeMensaje(message);

      if (!parsedDate) {
        const reply = "Entendido. ¿Para qué día y a qué hora quieres la cita?";
        await guardarMensaje(clientId, "assistant", reply);
        return res.json({ reply });
      }

      parsedDate.setSeconds(0);
      parsedDate.setMilliseconds(0);

      // createAppointment ya evita duplicados por @@unique([clientId, fecha])
      const appointment = await createAppointment(clientId, parsedDate, null);

      const fechaStr = dateToFechaStr(appointment.fecha);
      const reply = `Perfecto. He registrado tu cita para el ${fechaStr}, ${appointment.hora}.`;

      await guardarMensaje(clientId, "assistant", reply);
      return res.json({ reply, appointment });
    }

    // ---- IA normal (si no es cita) ----
    const reply = await obtenerRespuestaLumina(clientId, message, mode);
    await guardarMensaje(clientId, "assistant", reply);

    return res.json({ reply });
  } catch (err) {
    console.error("❌ Error en chatcontroller:", err);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: err.message || String(err),
    });
  }
}

/**
 * GET /api/chat/history?clientId=...
 */
async function getChatHistoryController(req, res) {
  try {
    const { clientId } = req.query;
    if (!clientId) return res.status(400).json({ error: "clientId requerido" });

    const messages = await prisma.message.findMany({
      where: { client_id: clientId },
      orderBy: { created_at: "asc" },
      select: { id: true, role: true, content: true, created_at: true },
    });

    return res.json({ messages });
  } catch (err) {
    console.error("❌ Error en getChatHistoryController:", err);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: err.message || String(err),
    });
  }
}

module.exports = { chatcontroller, getChatHistoryController };
