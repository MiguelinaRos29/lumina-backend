// controllers/chatController.js

const { parseFechaDesdeMensaje, extraerProposito } = require("../services/dateParser");
const { createAppointment } = require("../services/appointmentService");

// Estado por cliente (memoria RAM). Para MVP perfecto.
// Más adelante lo pasamos a BD/Redis.
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
    stateByClient.set(clientId, { step: "idle", pendingDate: null, pendingPurpose: null });
  }
  return stateByClient.get(clientId);
}

function resetState(clientId) {
  stateByClient.set(clientId, { step: "idle", pendingDate: null, pendingPurpose: null });
}

function normalizar(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/\s+/g, " ")
    .trim();
}

// ✅ Ahora soporta: "sí porfa", "ok perfecto", "vale confirmo", etc.
function isYes(text) {
  const t = normalizar(text);
  return (
    t === "si" ||
    t === "sí" ||
    t.includes("confirm") ||
    t.includes("vale") ||
    t === "ok" ||
    t.includes("de acuerdo") ||
    t.includes("perfecto") ||
    t.includes("adelante")
  );
}

// ✅ Distingue entre NO (cancelar) y cambiar hora
function wantsChangeTime(text) {
  const t = normalizar(text);
  return t.includes("cambiar hora") || t.includes("otra hora") || (t.includes("cambia") && t.includes("hora"));
}

function wantsChangeDay(text) {
  const t = normalizar(text);
  return t.includes("otro dia") || t.includes("otra fecha") || t.includes("cambiar dia") || t.includes("otro día");
}

function isNo(text) {
  const t = normalizar(text);
  // "no" simple o cancelar/anular
  return (
    t === "no" ||
    t.includes("cancel") ||
    t.includes("anular") ||
    t.includes("mejor no") ||
    t.includes("no quiero")
  );
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
  const t = normalizar(text);
  return ["curso", "asesoria", "informacion", "consultoria", "precio", "servicio"].some((k) => t.includes(k));
}

// Heurística simple: detectar intención de cita
function isAppointmentIntent(text) {
  const t = normalizar(text);
  return t.includes("cita") || t.includes("reserv") || t.includes("reunion");
}

// ✅ Regla: reprogramar SOLO la HORA dentro del MISMO DÍA
function setTimeSameDay(baseDate, newDate) {
  if (!(baseDate instanceof Date) || isNaN(baseDate)) return null;
  if (!(newDate instanceof Date) || isNaN(newDate)) return null;

  const merged = new Date(baseDate);
  merged.setHours(newDate.getHours(), newDate.getMinutes(), 0, 0);
  return merged;
}

// ⚠️ Aquí tú llamas a tu LLM/Groq. Yo dejo stub para que lo conectes donde ya lo tienes.
async function askLLM({ clientId, message, mode }) {
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
    // 0) Si está esperando NUEVA HORA (reprogramación)
    // =========================
    if (state.step === "awaitingNewTime") {
      // Si por lo que sea se perdió la fecha base, reiniciamos limpio
      if (!(state.pendingDate instanceof Date) || isNaN(state.pendingDate)) {
        resetState(clientId);
        return res.json({
          reply:
            "Se me perdió el contexto de la cita 🙏. Dime de nuevo **fecha y hora** (ej: “mañana a las 19”).",
        });
      }

      const dt = parseFechaDesdeMensaje(msg);
      if (!dt) {
        return res.json({
          reply:
            `Dime **otra hora** para el mismo día (${fmtDateLocal(state.pendingDate).slice(0, 10)}). ` +
            `Ej: “a las 21:00”.`,
        });
      }

      // ✅ Forzamos MISMO DÍA, solo cambia la hora
      const merged = setTimeSameDay(state.pendingDate, dt);
      if (!merged) {
        return res.json({ reply: "No pude entender la hora. Dime algo como: “a las 21” o “21:30”." });
      }

      state.pendingDate = merged;
      state.step = "awaitingConfirm";

      const texto =
        `Perfecto. Quedaría para **${fmtDateLocal(state.pendingDate)}**.` +
        (state.pendingPurpose ? `\nMotivo: **${state.pendingPurpose}**.` : "") +
        `\n\n¿Confirmas la cita? (Sí/No)`;

      return res.json({ reply: texto });
    }

    // =========================
    // 1) Si está esperando MOTIVO
    // =========================
    if (state.step === "awaitingPurpose") {
      if (!(state.pendingDate instanceof Date) || isNaN(state.pendingDate)) {
        // si se perdió, volvemos a pedir fecha/hora
        resetState(clientId);
        return res.json({
          reply:
            "Perfecto 😊 Antes dime **fecha y hora** para la cita (ej: “mañana a las 19”).",
        });
      }

      const proposito = msg.trim();
      state.pendingPurpose = proposito.slice(0, 140);
      state.step = "awaitingConfirm";

      const texto =
        `Perfecto. Tengo la cita para **${fmtDateLocal(state.pendingDate)}**.\n` +
        `Motivo: **${state.pendingPurpose}**.\n\n¿Confirmas la cita? (Sí/No)`;

      return res.json({ reply: texto });
    }

    // =========================
    // 2) Si está esperando CONFIRMACIÓN
    // =========================
    if (state.step === "awaitingConfirm") {
      // Si se perdió pendingDate, reiniciamos de forma amable
      if (!(state.pendingDate instanceof Date) || isNaN(state.pendingDate)) {
        resetState(clientId);
        return res.json({
          reply:
            "Se me perdió el contexto 🙏. Dime de nuevo **fecha y hora** para la cita (ej: “mañana a las 19”).",
        });
      }

      // ✅ Si el usuario quiere cambiar DÍA, no se permite (regla producto)
      if (wantsChangeDay(msg)) {
        resetState(clientId);
        return res.json({
          reply:
            "Para mantener el orden, solo puedo **cambiar la hora dentro del mismo día**.\n" +
            "Si quieres otro día, dime una **nueva solicitud de cita completa** (ej: “quiero una cita el viernes a las 18”).",
        });
      }

      // ✅ Si quiere cambiar la hora (o dice NO pero en realidad quiere moverla)
      if (wantsChangeTime(msg)) {
        state.step = "awaitingNewTime";
        return res.json({
          reply:
            `Claro 😊 Dime **otra hora para el mismo día** (${fmtDateLocal(state.pendingDate).slice(0, 10)}). ` +
            `Ej: “a las 21:00”.`,
        });
      }

      if (isYes(msg)) {
        try {
          const created = await createAppointment(clientId, state.pendingDate, state.pendingPurpose);

          let texto =
            `✅ Cita confirmada para **${fmtDateLocal(state.pendingDate)}**.` +
            (state.pendingPurpose ? `\nMotivo: **${state.pendingPurpose}**.` : "");

          // ✅ Ventas suaves SOLO cuando el motivo es comercial
          if (isVentaSoft(state.pendingPurpose)) {
            texto +=
              `\n\nPerfecto 😊 En esa cita revisaremos tu caso con calma y te explicaré las opciones que mejor encajen contigo.`;
          }

          resetState(clientId);
          return res.json({ reply: texto, appointment: created });
        } catch (err) {
          // ✅ Duplicado (Prisma)
          if (err?.code === "P2002") {
            // NO reseteamos, mantenemos el motivo y pedimos nueva hora
            state.step = "awaitingNewTime";
            return res.json({
              reply:
                "⚠️ Parece que esa cita ya estaba registrada para esa fecha y hora.\n" +
                "Dime **otra hora** para el mismo día (ej: “a las 21”).",
            });
          }

          return res.status(500).json({ error: "Error interno" });
        }
      }

      if (isNo(msg)) {
        // Si dijo "no" sin más, lo interpretamos como cancelar el flujo
        resetState(clientId);
        return res.json({ reply: "De acuerdo. Si más adelante quieres, dime: **“quiero una cita…”** 😊" });
      }

      return res.json({ reply: "¿Confirmas la cita? Responde **Sí** o **No** (o dime “cambiar hora”)." });
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

      state.pendingDate = dt;

      // Motivo si viene en el mismo mensaje
      const proposito = extraerProposito(msg);
      if (proposito) {
        state.pendingPurpose = proposito;
        state.step = "awaitingConfirm";
        return res.json({
          reply:
            `He detectado una cita para **${fmtDateLocal(dt)}**.\n` +
            `Motivo: **${proposito}**.\n\n¿Confirmas la cita? (Sí/No)`,
        });
      }

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
    return res.status(500).json({ error: "Error interno" });
  }
}

module.exports = { chatHandler };
