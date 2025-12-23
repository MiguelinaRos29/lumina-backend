// utils/ga4.js
const crypto = require("crypto");

function gaClientIdFromClientId(clientId) {
  const hex = crypto
    .createHash("sha256")
    .update(String(clientId))
    .digest("hex")
    .slice(0, 16);

  const a = parseInt(hex.slice(0, 8), 16);
  const b = parseInt(hex.slice(8, 16), 16);
  return `${a}.${b}`;
}

function boolEnv(name) {
  return String(process.env[name] || "").toLowerCase() === "true";
}

async function sendGAEvent(req, name, params = {}) {
  try {
    const MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
    const API_SECRET = process.env.GA4_API_SECRET;
    if (!MEASUREMENT_ID || !API_SECRET) return null;

    const useDebug = boolEnv("GA4_DEBUG");
    const endpoint = useDebug
      ? "https://www.google-analytics.com/debug/mp/collect"
      : "https://www.google-analytics.com/mp/collect";

    const url =
      `${endpoint}?measurement_id=${encodeURIComponent(MEASUREMENT_ID)}` +
      `&api_secret=${encodeURIComponent(API_SECRET)}`;

    const clientId =
      req?.body?.clientId ||
      req?.headers?.["x-client-id"] ||
      req?.query?.clientId ||
      "unknown_client";

    const payload = {
      client_id: gaClientIdFromClientId(clientId),
      events: [
        {
          name,
          params: {
            ...(useDebug ? { debug_mode: 1 } : {}),
            ...params,
            engagement_time_msec: 1,
          },
        },
      ],
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (useDebug) {
      // debug endpoint devuelve JSON con validationMessages
      const data = await res.json().catch(() => null);
      return { ok: res.ok, debug: data };
    }

    return { ok: res.ok };
  } catch (e) {
    return null;
  }
}

module.exports = { sendGAEvent };
