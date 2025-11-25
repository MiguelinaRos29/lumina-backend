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

    // 1) Guardar mensaje del usuario (si la tabla existe)
    try {
      await prisma.message.create({
        data: {
          clientId,
          role: "user",
          content: message,
        },
      });
    } catch (err) {
      console.warn("⚠ No se pudo guardar el mensaje del usuario en BD:", err.message);
    }

    // 2) Comprobar si hay un estado de cita pendiente
    const estadoCita = getEstadoCita(clientId);

    // Si estábamos esperando la fecha/detalles de la cita
    if (estadoCita === "esperando_fecha") {
      // Aquí simplemente usamos lo que el usuario diga como detalles de la cita
      const respuestaCita =
        "Perfecto, he registrado tu cita con estos detalles: " +
        message +
        ". Si quieres cambiarla o añadir más información, dímelo y lo actualizamos.";

      // Limpiamos estado
      limpiarEstadoCita(clientId);

      // Guardar respuesta del asistente (si la tabla existe)
      try {
        await prisma.message.create({
          data: {
            clientId,
            role: "assistant",
            content: respuestaCita,
          },
        });
      } catch (err) {
        console.warn("⚠ No se pudo guardar la respuesta de cita en BD:", err.message);
      }

      return res.json({
        reply: respuestaCita,
        clientId,
      });
    }

    // 3) Detectar intención del mensaje actual
    const intencion = detectarIntencion(message);

    // 3.a) El usuario quiere CREAR una cita
    if (intencion === "crear_cita") {
      setEstadoCita(clientId, "esperando_fecha");

      const respuestaCreacion =
        "¡Claro! Vamos a programar tu cita. " +
        "Por favor, dime la fecha y la hora en un solo mensaje. " +
        "Por ejemplo: \"mañana a las 16:00\" o \"15 de enero a las 10:30\".";

      try {
        await prisma.message.create({
          data: {
            clientId,
            role: "assistant",
            content: respuestaCreacion,
          },
        });
      } catch (err) {
        console.warn(
          "⚠ No se pudo guardar la respuesta de creación de cita en BD:",
          err.message
        );
      }

      return res.json({
        reply: respuestaCreacion,
        clientId,
      });
    }

    // 3.b) El usuario quiere LISTAR citas (por ahora solo respuesta genérica)
    if (intencion === "listar_citas") {
      const respuestaListado =
        "Puedo ayudarte a gestionar tus citas. " +
        "En esta versión de MyClarix todavía no mostramos un listado detallado, " +
        "pero puedo registrar nuevas citas y confirmar la información contigo.";

      try {
        await prisma.message.create({
          data: {
            clientId,
            role: "assistant",
            content: respuestaListado,
          },
        });
      } catch (err) {
        console.warn(
          "⚠ No se pudo guardar la respuesta de listado de citas en BD:",
          err.message
        );
      }

      return res.json({
        reply: respuestaListado,
        clientId,
      });
    }

    // 4) Si no es nada especial de citas → pasar a la IA normal (Lumina/MyClarix)
    const respuestaIA = await obtenerRespuestaLumina(clientId, message, mode);

    // Guardar respuesta del asistente (si la tabla existe)
    try {
      await prisma.message.create({
        data: {
          clientId,
          role: "assistant",
          content: respuestaIA,
        },
      });
    } catch (err) {
      console.warn(
        "⚠ No se pudo guardar la respuesta de la IA en BD:",
        err.message
      );
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
// GET /api/chat/history?clientId=XXXX  → historial básico de mensajes
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
      console.warn(
        "⚠ No se pudo obtener el historial desde la BD:",
        err.message
      );
    }

    return res.json({ clientId, messages });
  } catch (error) {
    console.error("❌ Error en getHistory:", error);
    return res
      .status(500)
      .json({ error: "Error interno del servidor en /api/chat/history" });
  }
};
