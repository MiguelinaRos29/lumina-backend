// controllers/chatcontroller.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { obtenerRespuestaLumina } = require("../services/luminaAI");
const {
  setEstadoCita,
  getEstadoCita,
  limpiarEstadoCita,
} = require("../services/appointmentState");
const { detectarIntencion } = require("../services/intentDetection");

// ---------------------------------------------------------------------------
// POST /api/chat  → controlador principal del chat
// ---------------------------------------------------------------------------
exports.chatcontroller = async (req, res) => {
  try {
    const { clientId, message, mode } = req.body;

    if (!clientId || !message) {
      return res
        .status(400)
        .json({ error: "clientId y message son obligatorios" });
    }

    // 1) Guardar mensaje del usuario
    try {
      await prisma.message.create({
        data: {
          clientId,
          role: "user",
          content: message,
        },
      });
    } catch (err) {
      console.warn("⚠ No se pudo guardar el mensaje del usuario:", err.message);
    }

    // 2) Comprobar si hay un estado pendiente de cita
    const estadoCita = getEstadoCita(clientId);

    if (estadoCita === "esperando_fecha") {
      const respuestaCita =
        "Perfecto. He registrado tu cita con estos detalles: " +
        message +
        ". Si quieres añadir cambios, solo dímelo.";

      limpiarEstadoCita(clientId);

      try {
        await prisma.message.create({
          data: {
            clientId,
            role: "assistant",
            content: respuestaCita,
          },
        });
      } catch (err) {
        console.warn("⚠ No se pudo guardar la respuesta de cita:", err.message);
      }

      return res.json({
        reply: respuestaCita,
        clientId,
      });
    }

    // 3) Detectar intención (crear o listar citas)
    const intencion = detectarIntencion(message);

    if (intencion === "crear_cita") {
      setEstadoCita(clientId, "esperando_fecha");

      const respuestaCreacion =
        "Perfecto, vamos a crear una cita. Dime la fecha y la hora en un solo mensaje.";

      try {
        await prisma.message.create({
          data: {
            clientId,
            role: "assistant",
            content: respuestaCreacion,
          },
        });
      } catch (err) {
        console.warn("⚠ No se pudo guardar la respuesta:", err.message);
      }

      return res.json({
        reply: respuestaCreacion,
        clientId,
      });
    }

    if (intencion === "listar_citas") {
      const respuestaListado =
        "Puedo ayudarte a gestionar tus citas. En esta versión todavía no muestro un listado detallado.";

      try {
        await prisma.message.create({
          data: {
            clientId,
            role: "assistant",
            content: respuestaListado,
          },
        });
      } catch (err) {
        console.warn("⚠ No se pudo guardar la respuesta:", err.message);
      }

      return res.json({
        reply: respuestaListado,
        clientId,
      });
    }

    // 4) Si no es nada de citas → respuesta normal IA
    const respuestaIA = await obtenerRespuestaLumina(clientId, message, mode);

    try {
      await prisma.message.create({
        data: {
          clientId,
          role: "assistant",
          content: respuestaIA,
        },
      });
    } catch (err) {
      console.warn("⚠ No se pudo guardar la respuesta de la IA:", err.message);
    }

    return res.json({
      reply: respuestaIA,
      clientId,
    });
  } catch (error) {
    console.error("❌ Error en chatcontroller:", error);
    return res
      .status(500)
      .json({ error: "Error interno del servidor en /api/chat" });
  }
};

// ---------------------------------------------------------------------------
// GET /api/chat/history?clientId=XXXX
// ---------------------------------------------------------------------------
exports.getHistory = async (req, res) => {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: "clientId es obligatorio" });
    }

    let messages = [];

    try {
      messages = await prisma.message.findMany({
        where: { clientId },
        orderBy: { createdAt: "asc" },
      });
    } catch (err) {
      console.warn("⚠ No se pudo obtener el historial:", err.message);
    }

    return res.json({ clientId, messages });
  } catch (error) {
    console.error("❌ Error en getHistory:", error);
    return res
      .status(500)
      .json({ error: "Error interno del servidor en /api/chat/history" });
  }
};
