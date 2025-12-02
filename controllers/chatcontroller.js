// controllers/chatcontroller.js

const { obtenerRespuestaLumina } = require("../services/luminaAI");
const { parseFechaDesdeMensaje } = require("../services/dateParser");
const { createAppointment } = require("../services/appointmentService");

/**
 * Detecta si el mensaje del usuario habla de una cita,
 * aunque todavía no tenga fecha/hora concreta.
 */
function esIntencionDeCita(texto = "") {
  const t = texto.toLowerCase();

  return (
    t.includes("cita") ||
    t.includes("reunión") ||
    t.includes("reunion") ||
    t.includes("consulta") ||
    t.includes("reservar") ||
    t.includes("agendar") ||
    t.includes("pedir hora") ||
    t.includes("quiero una cita") ||
    t.includes("quiero pedir una cita")
  );
}

/**
 * Formatea la fecha de la cita en español, bonito para el usuario.
 */
function formatearFechaCita(fecha) {
  try {
    return fecha.toLocaleString("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Madrid",
    });
  } catch (e) {
    return fecha.toISOString();
  }
}

async function chatcontroller(req, res) {
  try {
    const { message, clientId, mode } = req.body || {};

    if (!message || !clientId) {
      return res.status(400).json({
        error: "Faltan parámetros: 'message' y/o 'clientId'",
      });
    }

    console.log("📩 [chatcontroller] Mensaje recibido:", {
      clientId,
      message,
      mode,
    });

    // 1) Intento de parsear fecha/hora del mensaje
    const fechaCita = parseFechaDesdeMensaje(message);

    // 2) Si el texto habla de cita y NO hay fecha → pedir fecha/hora
    if (esIntencionDeCita(message) && !fechaCita) {
      const text =
        'Perfecto, vamos a crear una cita. Dime la fecha y la hora en un solo mensaje (por ejemplo: "mañana a las 16:00" o "el 5 de diciembre a las 10:30").';

      const responsePayload = {
        clientId,
        type: "appointment_ask_datetime",
        text,
        reply: text, // compatibilidad con la versión antigua
      };

      console.log(
        "🟡 [chatcontroller] Intención de cita detectada, falta fecha/hora:",
        responsePayload
      );

      return res.json(responsePayload);
    }

    // 3) Si HAY fecha/hora detectada → crear la cita en BD
    if (fechaCita) {
      console.log(
        "🟢 [chatcontroller] Fecha detectada, creando cita en BD:",
        fechaCita
      );

      const appointment = await createAppointment(clientId, fechaCita);

const fechaFormateada = formatearFechaCita(fechaCita);

const text = `Perfecto. He registrado tu cita para el ${fechaFormateada}.`;

const responsePayload = {
  clientId,
  type: "appointment_created",
  text,
  reply: text, // compatibilidad con el antiguo 'reply'
  appointment: {
    id: appointment.id,
    fecha: appointment.fecha,
    hora: appointment.hora,
    status: appointment.status,
  },
};


      console.log(
        "✅ [chatcontroller] Cita creada correctamente:",
        responsePayload
      );

      return res.json(responsePayload);
    }

    // 4) Si no es cita → chat normal con la IA
    console.log(
      "💬 [chatcontroller] Mensaje normal, se envía a la IA (Lumina/MyClarix)"
    );

    // ⚠️ IMPORTANTE:
    // Ajusta el orden de parámetros si tu función obtenerRespuestaLumina
    // tiene una firma distinta. Esto es SOLO un ejemplo.
    const iaReply = await obtenerRespuestaLumina(message, clientId, mode);

    const responsePayload = {
      clientId,
      type: "normal",
      text: iaReply,
      reply: iaReply, // para compatibilidad con la app actual
    };

    console.log("🤖 [chatcontroller] Respuesta IA:", responsePayload);

    return res.json(responsePayload);
  } catch (error) {
    console.error("❌ [chatcontroller] Error:", error);

    return res.status(500).json({
      error: "Error interno en el chatcontroller",
      details: error.message,
    });
  }
}

module.exports = {
  chatcontroller,
};
