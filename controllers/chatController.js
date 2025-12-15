// controllers/chatController.js

const { parseFechaDesdeMensaje, extraerProposito } = require("../services/dateParser");
const { createAppointment } = require("../services/appointmentService");

// Estado por cliente (memoria RAM). Para MVP perfecto.
// Más adelante lo pasamos a BD/Redis.
const stateByClient = new Map();
/**
 * state = {
 *   step: "idle" | "awaitingPurpose" | "awaitingConfirm",
 *   pendingDate: Date|null,
 *   pendingPurpose: string|null
 * }
 */

function getState(clientId) {
  if (!stateByClient.has(clientId)) {
    stateByClient.set(clientId, { step: "idle", pendingDate: null, pendingPurpose: null });
  }
  return stateByClient.get(clientId);
}

function resetState(clientId) {
  stateByClient.set(clientId, { step: "idle", pendingDate: null, pendingPurpose: null });
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

// ✅ Ventas suaves SOLO si el motivo indica intención comercial
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

// ⚠️ Aquí tú llamas a tu LLM/Groq. Yo dejo stub para que lo conectes donde ya lo tienes.
async function askLLM({ clientId, message, mode }) {
  // TODO: integra tu Groq/Llama como ya lo tienes en tu proyecto.
  // Debe devolver string.
  return "Ok.";
}

async function chatHandler(req, res) {
  try {
    const { clientId, message, mode = "general" } = req.body || {};
    if (!clientId || !message) {
      return res.status(400).json({ error: "clientId y message son requeridos" });
    }

    const state = getState(clientId);
    const msg = String(message);

    // =========================
    // 1) Si está esperando MOTIVO
    // =========================
    if (state.step === "awaitingPurpose") {
      const proposito = msg.trim();
      state.pendingPurpose = proposito.slice(0, 140);
      state.step = "awaitingConfirm";

      const texto = `Perfecto. Tengo la cita para **${fmtDateLocal(state.pendingDate)}**.\nMotivo: **${state.pendingPurpose}**.\n\n¿Confirmas la cita? (Sí/No)`;
      return res.json({ reply: texto });
    }

    // =========================
    // 2) Si está esperando CONFIRMACIÓN
    // =========================
    if (state.step === "awaitingConfirm") {
      if (isYes(msg)) {
        try {
          const created = await createAppointment(clientId, state.pendingDate, state.pendingPurpose);

          let texto =
            `✅ Cita confirmada para **${fmtDateLocal(state.pendingDate)}**.` +
            (state.pendingPurpose ? `\nMotivo: **${state.pendingPurpose}**.` : "");

          // ✅ Añadimos ventas suaves SOLO cuando el motivo es comercial
          if (isVentaSoft(state.pendingPurpose)) {
            texto +=
              `\n\nPerfecto 😊 En esa cita revisaremos tu caso con calma y te explicaré las opciones que mejor encajen contigo.`;
          }

          resetState(clientId);
          return res.json({ reply: texto, appointment: created });

        } catch (err) {
          // ✅ Duplicado (Prisma)
          if (err?.code === "P2002") {
            resetState(clientId);
            return res.json({
              reply:
                "⚠️ Parece que esa cita ya estaba registrada para esa fecha y hora.\n" +
                "Dime **otra hora** para la cita (ej: “mañana a las 21”).",
            });
          }

          // ✅ Respuesta limpia sin detalles
          return res.status(500).json({
            error: "Error interno",
          });
        }
      }

      if (isNo(msg)) {
        // cancelamos flujo y pedimos nueva fecha/hora
        const texto = "De acuerdo. Dime **otra fecha y hora** para la cita (por ejemplo: “mañana a las 18”).";
        resetState(clientId);
        return res.json({ reply: texto });
      }

      return res.json({ reply: "¿Confirmas la cita? Responde **Sí** o **No**." });
    }

    // =========================
    // 3) Flujo normal: detectar cita
    // =========================
    if (isAppointmentIntent(msg)) {
      const dt = parseFechaDesdeMensaje(msg);
      if (!dt) {
        return res.json({
          reply:
            "Entendido. Dime **fecha y hora** para la cita (ej: “mañana a las 19”, “el día 16 a las 14”).",
        });
      }

      // Guardamos fecha en estado
      state.pendingDate = dt;

      // Motivo si viene en el mismo mensaje
      const proposito = extraerProposito(msg);
      if (proposito) {
        state.pendingPurpose = proposito;
        state.step = "awaitingConfirm";
        return res.json({
          reply: `He detectado una cita para **${fmtDateLocal(dt)}**.\nMotivo: **${proposito}**.\n\n¿Confirmas la cita? (Sí/No)`,
        });
      }

      // Si no hay motivo, lo pedimos (viable y simple)
      state.pendingPurpose = null;
      state.step = "awaitingPurpose";
      return res.json({
        reply: `He detectado una cita para **${fmtDateLocal(dt)}**.\n\n¿Para qué es la cita? (motivo breve)`,
      });
    }

    // =========================
    // 4) No es cita: respuesta IA normal (SIN SALUDO LARGO)
    // =========================
    const llmText = await askLLM({ clientId, message: msg, mode });
    return res.json({ reply: llmText });

  } catch (err) {
    // ✅ Respuesta limpia sin detalles
    return res.status(500).json({
      error: "Error interno",
    });
  }
}

module.exports = { chatHandler };
