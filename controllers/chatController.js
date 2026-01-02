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

// -------------------------------
// ✅ MINI FALLBACK (respuestas útiles sin LLM)
// -------------------------------
function normalize(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function isGenericLLMReply(txt) {
  const t = normalize(txt);
  if (!t) return true;
  // Respuestas demasiado cortas / vacías / genéricas
  return [
    "ok",
    "vale",
    "de acuerdo",
    "perfecto",
    "listo",
    "entendido",
    "bien",
    "claro",
    "ok.",
    "vale.",
    "si",
    "sí",
  ].includes(t) || t.length <= 3;
}

/**
 * Devuelve string si puede ayudar con reglas simples; si no, null.
 * OJO: esto no reemplaza al LLM, solo evita el “Ok.” y guía al usuario.
 */
function miniFallbackReply(message, mode = "general") {
  const t = normalize(message);

  // Saludos / cortesía
  if (/(^hola\b|buenos dias|buenas|hey\b)/.test(t)) {
    return "¡Hola! 😊 Dime qué necesitas: **citas**, **información**, **precios**, o **cómo funciona**.";
  }

  // Preguntas de precio/tarifa
  const asksPrice =
    t.includes("precio") ||
    t.includes("precios") ||
    t.includes("tarifa") ||
    t.includes("cuanto cuesta") ||
    t.includes("cuánto cuesta") ||
    t.includes("coste") ||
    t.includes("valor");

  // Preguntas tipo “info / cómo funciona”
  const asksHow =
    t.includes("como funciona") ||
    t.includes("cómo funciona") ||
    t.includes("que es") ||
    t.includes("qué es") ||
    t.includes("informacion") ||
    t.includes("información") ||
    t.includes("me das info") ||
    t.includes("explicame") ||
    t.includes("explícame");

  // Detectar “curso”
  const mentionsCourse = t.includes("curso") || t.includes("ciberdemia");

  // Ajuste por modo
  const m = String(mode || "general").toLowerCase();

  if (asksPrice) {
    if (mentionsCourse) {
      return (
        "Claro. Para darte **el precio exacto** dime 2 cosas:\n" +
        "1) **Nombre del curso** (o tema)\n" +
        "2) **Modalidad** (online / en vivo / con tutor)\n\n" +
        "Y si quieres, dime tu objetivo y te recomiendo la opción más rentable."
      );
    }
    if (m === "ventas") {
      return (
        "Sí 😊 Para decirte **precio** necesito saber qué te interesa:\n" +
        "• **MyClarix** (asistente para negocios)\n" +
        "• **Merkatéalo** (tienda / marketing)\n" +
        "• **Ciberdemia** (formación)\n\n" +
        "Dime cuál y qué tamaño de negocio tienes (1 persona / equipo)."
      );
    }
    return (
      "Claro 😊 ¿Precio de qué exactamente?\n" +
      "Dime si es **un curso**, **un servicio** o **MyClarix**, y te lo detallo."
    );
  }

  if (asksHow) {
    if (m === "ventas") {
      return (
        "Te explico rápido cómo funciona **MyClarix**:\n" +
        "1) Atiende clientes 24/7 (WhatsApp/web/redes)\n" +
        "2) Responde dudas y filtra leads\n" +
        "3) **Agenda citas** en lenguaje natural\n" +
        "4) Registra métricas para vender con datos\n\n" +
        "Dime tu negocio (peluquería, academia, etc.) y te digo el flujo ideal."
      );
    }
    if (mentionsCourse) {
      return (
        "Claro. En **Ciberdemia** los cursos funcionan así:\n" +
        "• Acceso al contenido por módulos\n" +
        "• Recursos descargables (según curso)\n" +
        "• Soporte/tutoría (si aplica)\n\n" +
        "Dime el **curso** y si lo quieres para aprender o certificarte."
      );
    }
    return (
      "Perfecto. Dime exactamente qué quieres saber:\n" +
      "• **Cómo funciona** (MyClarix / Merkatéalo / Ciberdemia)\n" +
      "• **Qué incluye**\n" +
      "• **Precios**\n\n" +
      "Y te lo explico en 30 segundos 😉"
    );
  }

  // Si preguntan por “información” sin especificar
  if (t.includes("informacion") || t.includes("información") || t.includes("info")) {
    return "Dime de qué necesitas info (curso/servicio/MyClarix) y qué objetivo tienes, y te doy la explicación exacta.";
  }

  // Si llegan aquí: no tenemos una regla clara
  return null;
}

// ⚠️ Stub de tu LLM (conéctalo donde ya lo tienes)
async function askLLM({ clientId, message, mode }) {
  // TODO: conectar a tu proveedor real (Groq/OpenAI/etc.)
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

  // 4) No es cita: ✅ MINI FALLBACK primero, luego LLM
  const quick = miniFallbackReply(msg, mode);
  if (quick) return quick;

  const llmText = await askLLM({ clientId, message: msg, mode });

  // Si el LLM responde genérico, usamos fallback de “guía”
  if (isGenericLLMReply(llmText)) {
    return (
      "Dime un poco más para ayudarte bien 😊\n" +
      "• ¿Buscas **precios**, **información**, o **agendar una cita**?\n" +
      "• ¿Sobre **MyClarix**, **Ciberdemia** o **Merkatéalo**?"
    );
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
