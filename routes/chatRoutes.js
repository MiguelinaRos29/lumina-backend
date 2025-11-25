// routes/chatRoutes.js
exports.chatcontroller = async (req, res) => {
  try {
    const { clientId, message } = req.body;

    // 1) Miramos si este cliente estaba en modo "esperando fecha"
    const estado = getEstadoCita(clientId);
    if (estado === "esperando_fecha") {
      // Intentamos interpretar la fecha/hora de este nuevo mensaje
      const fecha = parseFechaDesdeMensaje(message);

      if (!fecha) {
        return res.json({
          reply: "No he entendido bien la fecha y hora. Escríbela en formato 15/01/2026 a las 16:00, por favor.",
          clientId,
        });
      }

      const cita = await crearCitaParaCliente(clientId, fecha);
      limpiarEstadoCita(clientId);

      return res.json({
        reply: `He creado tu cita para el día ${cita.date.toLocaleDateString()} a las ${cita.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        clientId,
      });
    }

    // 2) Detectamos intención del mensaje actual
    const intencion = detectarIntencion(message);

    if (intencion === "crear_cita") {
      // Intentamos sacar la fecha/hora directamente del mensaje
      const fecha = parseFechaDesdeMensaje(message);

      if (!fecha) {
        // No se entiende -> pasamos a modo "esperando fecha"
        setEstadoCita(clientId, "esperando_fecha");
        return res.json({
          reply: "Claro, ¿para qué día y a qué hora quieres la cita? Escríbelo por ejemplo así: 15/01/2026 a las 16:00.",
          clientId,
        });
      }

      // Sí se entendió la fecha/hora, creamos la cita directamente
      const cita = await crearCitaParaCliente(clientId, fecha);

      return res.json({
        reply: `Perfecto, he creado tu cita para el día ${cita.date.toLocaleDateString()} a las ${cita.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        clientId,
      });
    }

    if (intencion === "listar_citas") {
      const citas = await listarCitasDeCliente(clientId);

      if (!citas.length) {
        return res.json({
          reply: "No tienes citas registradas.",
          clientId,
        });
      }

      const textoCitas = citas
        .map(
          (c) =>
            `• ${c.date.toLocaleDateString()} a las ${c.date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })} (${c.status})`
        )
        .join("\n");

      return res.json({
        reply: `Estas son tus próximas citas:\n${textoCitas}`,
        clientId,
      });
    }

    // 3) Si no es nada de citas → IA normal
    const respuesta = await obtenerRespuestaLumina(clientId, message);

    return res.json({
      reply: respuesta,
      clientId,
    });
  } catch (error) {
    console.log("❌ Error en chatcontroller:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

const { detectarIntencion } = require("../services/intentDetection");
const { parseFechaDesdeMensaje } = require("../services/dateParser");
const {
  setEstadoCita,
  getEstadoCita,
  limpiarEstadoCita,
} = require("../services/appointmentState");
const {
  crearCitaParaCliente,
  listarCitasDeCliente,
} = require("../services/appointmentService");

// Y tu servicio actual de IA:
const { obtenerRespuestaLumina } = require("../services/luminaAI");

const express = require('express');
const { chatcontroller, getHistory } = require('../controllers/chatcontroller');

const router = express.Router();

// POST /api/chat  → hablar con Lumina
router.post('/', chatcontroller);

// GET /api/chat/history?clientId=xxx  → traer historial
router.get('/history', getHistory);

module.exports = router;

