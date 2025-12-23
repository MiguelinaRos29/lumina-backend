// controllers/metricsController.js
const crypto = require("crypto");

// GA4 Measurement Protocol endpoint
const GA4_ENDPOINT = "https://www.google-analytics.com/mp/collect";

// Helpers
function safeStr(v, max = 100) {
  if (v === null || v === undefined) return "";
  return String(v).trim().slice(0, max);
}

function isNonEmpty(v) {
  return typeof v === "string" && v.trim().length > 0;
}

// ✅ Endpoint: POST /api/metrics/ga4
// Body esperado:
// {
//   "clientId": "mobile_client_1",
//   "event": "appointment_confirmed",
//   "params": { ... opcional ... }
// }
async function trackGa4(req, res) {
  try {
    const measurementId = process.env.GA4_MEASUREMENT_ID; // ej: G-CPVCTZYKQT
    const apiSecret = process.env.GA4_API_SECRET;         // tu secret
    const env = process.env.NODE_ENV || "development";

    if (!measurementId || !apiSecret) {
      return res.status(500).json({
        error: "GA4 no configurado",
        details: "Faltan GA4_MEASUREMENT_ID o GA4_API_SECRET en variables de entorno",
      });
    }

    const { clientId, event, params } = req.body || {};

    if (!isNonEmpty(clientId) || !isNonEmpty(event)) {
      return res.status(400).json({
        error: "clientId y event son requeridos",
      });
    }

    // ✅ GA4 requiere client_id. Usamos el clientId del chat/app.
    // Si quieres algo más “GA4-friendly”, podemos mapear a UUID.
    const gaClientId = safeStr(clientId, 64);

    // ✅ Nombre de evento: solo letras, números y guiones bajos, max 40
    const eventName = safeStr(event, 40).replace(/[^a-zA-Z0-9_]/g, "_");

    const finalParams = {
      // marcamos origen y entorno
      source: "myclarix_server",
      env,
      ...((params && typeof params === "object") ? params : {}),
    };

    // ✅ Payload GA4 Measurement Protocol
    const payload = {
      client_id: gaClientId,
      events: [
        {
          name: eventName,
          params: finalParams,
        },
      ],
    };

    const url = `${GA4_ENDPOINT}?measurement_id=${encodeURIComponent(
      measurementId
    )}&api_secret=${encodeURIComponent(apiSecret)}`;

    // Node >=18 tiene fetch global
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // GA4 responde 2xx sin body normalmente
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return res.status(500).json({
        error: "Error enviando evento a GA4",
        details: txt || `HTTP ${r.status}`,
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({
      error: "Error interno",
      details: String(err?.message || err),
    });
  }
}

module.exports = { trackGa4 };
