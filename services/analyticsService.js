// services/analyticsService.js

const MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
const API_SECRET = process.env.GA4_API_SECRET;
const ENABLED = String(process.env.ANALYTICS_ENABLED || "").toLowerCase() === "true";

/**
 * Envía eventos a GA4 (Measurement Protocol).
 * NO envíes PII (nombres, teléfonos, emails).
 * client_id debe ser un identificador pseudónimo (tu clientId vale).
 */
async function trackEvent({ clientId, eventName, params = {} }) {
  try {
    if (!ENABLED) return;
    if (!MEASUREMENT_ID || !API_SECRET) return;
    if (!clientId || !eventName) return;

    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`;

    const body = {
      client_id: String(clientId),
      events: [
        {
          name: String(eventName),
          params: {
            // recomendado por GA4 para debug (opcional)
            // debug_mode: 1,
            app: "myclarix",
            ...params,
          },
        },
      ],
    };

    // Node 18+ tiene fetch global. Render con Node 22 perfecto.
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    // silencioso para no romper el flujo del usuario
    console.log("analytics trackEvent error:", String(e?.message || e));
  }
}

module.exports = { trackEvent };
