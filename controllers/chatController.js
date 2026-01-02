// controllers/chatController.js
const {
  parseFechaDesdeMensaje,
  extraerProposito,
} = require("../services/dateParser");

const { createAppointment } = require("../services/appointmentService");
const { sendGAEvent } = require("../utils/ga4");

// Estado por cliente (memoria RAM). Para MVP perfecto.
const stateByClient = new Map();
/**
 * state = {
 *   step: "idle" | "awaitingPurpose" | "awaitingConfirm" | "awaitingNewTime",
 *   pendingDate: Date|null,
 *   pendingPurpose: string|null
 * }
 */

function getState(clientId) {
  if (!stateByClient.has(clientId)) {
    stateByClient.set(clientId, {
      step: "idle",
      pendingDate: null,
      pendingPurpose: null,
    });
  }
  return stateByClient.get(clientId);
}

function resetState(clientId) {
  stateByClient.set(clientId, {
    step: "idle",
    pendingDate: null,
    pendingPurpose: null,
  });
}

function isYes(text) {
  const t = (text || "").toLowerCase().trim();
  return ["si", "sí", "confirmo", "confirmar", "vale", "ok", "de acuerdo", "perfecto"].includes(t);
}
function isNo(text) {
  const t = (text || "").toLowerCase().trim();
  return ["no", "cancelar", "anular", "mejor no", "cambia", "cambiar", "otro dia", "otra hora"].includes(t);
}

function fmtDateLocal(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}, ${hh}:${mi}`;
}

function dateToYMDHM(d) {
  if (!(d instanceof Date) || isNaN(d)) return { ymd: null, hm: null };
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { ymd, hm };
}

// Ventas suaves SOLO si el motivo indica intención comercial
function isVentaSoft(text) {
  const t = (text || "").toLowerCase();
  return [
    "curso",
    "asesoría",
    "asesoria",
    "información",
    "informacion",
    "consultoría",
    "consultoria",
    "precio",
    "servicio",
  ].some((k) => t.includes(k));
}

// Heurística simple: detectar intención de cita
function isAppointmentIntent(text) {
  const t = (text || "").toLowerCase();
  return t.includes("cita") || t.includes("reserv") || t.includes("reunion") || t.includes("reunión");
}

// ✅ Mini fallback (para que NUNCA responda "Ok." a preguntas normales)
function fallbackReply({ message, mode = "general" }) {
  const t = (message || "").toLowerCase();

  // preguntas típicas
  const askPrice = t.includes("precio") || t.includes("cuesta") || t.includes("tarifa") || t.includes("coste");
  const askHow = t.includes("como funciona") || t.includes("cómo funciona") || t.includes("que hace") || t.includes("qué hace");
  const askInfo = t.includes("informacion") || t.includes("información") || t.includes("detalles") || t.includes("info");

  // respuestas por modo (mínimas, humanas, sin inventar datos)
  if (askPrice) {
    return "Claro 😊 ¿De qué curso/servicio me hablas exactamente y para cuántas personas? Así te doy el precio correcto o te paso opciones.";
  }

  if (askHow) {
    return "MyClarix te ayuda a atender clientes 24/7, responder dudas, y gestionar citas en lenguaje natural. ¿Lo quieres para WhatsApp, web, o ambos?";
  }

  if (askInfo) {
    return "Perfecto. Dime qué necesitas: ¿contenido del curso, duración, modalidad, o si incluye certificado? Te lo resumo en 3 puntos.";
  }

  // fallback por modo (sin inventar, guiando)
  if (String(mode).toLowerCase() === "ventas") {
    return "Genial. Para orientarte bien: ¿buscas atraer clientes, automatizar respuestas, o cerrar ventas? Dime tu objetivo y te propongo el siguiente paso.";
  }

  if (String(mode).toLowerCase() === "contenidos") {
    return "Dime tema y formato (reel, carrusel, post, email) y te preparo una propuesta lista para publicar.";
  }

  if (String(mode).toLowerCase() === "organizacion" || String(mode).toLowerCase() === "organización") {
    return "Perfecto. ¿Qué necesitas ordenar hoy: tareas, calendario, o prioridades? Si me dices 3 pendientes, te lo dejo en orden de impacto.";
  }

  return "Te entiendo 😊 Dime un poco más (1 frase) de lo que necesitas y te respondo directo. Si es una cita, dime fecha y hora.";
}

// ⚠️ Stub de tu LLM (conéctalo donde ya lo tienes)
async function askLLM({ clientId, message, mode }) {
  return "Ok.";
}

/**
 * ✅ Función reutilizable:
 * Sirve tanto para POST /api (app/web) como para WhatsApp webhook
 */
async function handleIncomingMessage({ req, clientId, message, mode = "general" }) {
  const state = getState(clientId);
  const msg = String(message);

  // 0) Esperando NUEVA HORA
  if (state.step === "awaitingNewTime") {
    const dt = parseFechaDesdeMensaje(msg);
    if (!dt) {
      return "Dime **otra hora** para la cita (ej: “mañana a las 21”).";
    }

    state.pendingDate = dt;
    state.step = "awaitingConfirm";

    return (
      `Perfecto. Nueva cita detectada para **${fmtDateLocal(dt)}**.` +
      (state.pendingPurpose ? `\nMotivo: **${state.pendingPurpose}**.` : "") +
      `\n\n¿Confirmas la cita? (Sí/No)`
    );
  }

  // 1) Esperando MOTIVO
  if (state.step === "awaitingPurpose") {
    const proposito = msg.trim();
    state.pendingPurpose = proposito.slice(0, 140);
    state.step = "awaitingConfirm";

    return `Perfecto. Tengo la cita para **${fmtDateLocal(state.pendingDate)}**.\nMotivo: **${state.pendingPurpose}**.\n\n¿Confirmas la cita? (Sí/No)`;
  }

  // 2) Esperando CONFIRMACIÓN
  if (state.step === "awaitingConfirm") {
    if (isYes(msg)) {
      try {
        const created = await createAppointment(clientId, state.pendingDate, state.pendingPurpose);

        const { ymd, hm } = dateToYMDHM(state.pendingDate);
        if (req) {
          await sendGAEvent(req, "appointment_confirmed", {
            mode: String(mode || "general"),
            date: ymd || undefined,
            time: hm || undefined,
            has_purpose: !!state.pendingPurpose,
            venta_soft: isVentaSoft(state.pendingPurpose || ""),
          });
        }

        let texto =
          `✅ Cita confirmada para **${fmtDateLocal(state.pendingDate)}**.` +
          (state.pendingPurpose ? `\nMotivo: **${state.pendingPurpose}**.` : "");

        if (isVentaSoft(state.pendingPurpose)) {
          texto += `\n\nPerfecto 😊 En esa cita revisaremos tu caso con calma y te explicaré las opciones que mejor encajen contigo.`;
        }

        resetState(clientId);
        return texto;
      } catch (err) {
        if (err?.code === "P2002") {
          const { ymd, hm } = dateToYMDHM(state.pendingDate);
          if (req) {
            await sendGAEvent(req, "appointment_duplicate_retry", {
              mode: String(mode || "general"),
              date: ymd || undefined,
              time: hm || undefined,
            });
          }

          state.step = "awaitingNewTime";
          return (
            "⚠️ Parece que esa cita ya estaba registrada para esa fecha y hora.\n" +
            "Dime **otra hora** para la cita (ej: “mañana a las 21”)."
          );
        }

        return "⚠️ Hubo un error interno creando la cita. ¿Me repites la fecha y hora, por favor?";
      }
    }

    if (isNo(msg)) {
      if (req) {
        await sendGAEvent(req, "appointment_flow_cancelled", {
          mode: String(mode || "general"),
          step: "awaitingConfirm",
        });
      }

      resetState(clientId);
      return "De acuerdo. Dime **otra fecha y hora** para la cita (por ejemplo: “mañana a las 18”).";
    }

    return "¿Confirmas la cita? Responde **Sí** o **No**.";
  }

  // 3) Flujo normal: detectar cita
  if (isAppointmentIntent(msg)) {
    if (req) {
      await sendGAEvent(req, "appointment_flow_started", {
        mode: String(mode || "general"),
      });
    }

    const dt = parseFechaDesdeMensaje(msg);
    if (!dt) {
      return "Entendido. Dime **fecha y hora** para la cita (ej: “mañana a las 19”, “el día 16 a las 14”).";
    }

    state.pendingDate = dt;

    const proposito = extraerProposito(msg);
    if (proposito) {
      state.pendingPurpose = proposito;
      state.step = "awaitingConfirm";
      return `He detectado una cita para **${fmtDateLocal(dt)}**.\nMotivo: **${proposito}**.\n\n¿Confirmas la cita? (Sí/No)`;
    }

    state.pendingPurpose = null;
    state.step = "awaitingPurpose";
    return `He detectado una cita para **${fmtDateLocal(dt)}**.\n\n¿Para qué es la cita? (motivo breve)`;
  }

  // 4) No es cita: respuesta IA normal
  const llmText = await askLLM({ clientId, message: msg, mode });

  // ✅ mini fallback si el LLM aún no está conectado (evita "Ok.")
  if (!llmText || String(llmText).trim().toLowerCase() === "ok.") {
    return fallbackReply({ message: msg, mode });
  }

  return llmText;
}

async function chatHandler(req, res) {
  try {
    const { clientId, message, mode = "general" } = req.body || {};
    if (!clientId || !message) {
      return res.status(400).json({ error: "clientId y message son requeridos" });
    }

    const reply = await handleIncomingMessage({ req, clientId, message, mode });
    return res.json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Error interno" });
  }
}

module.exports = { chatHandler, handleIncomingMessage };

