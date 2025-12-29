// routes/whatsappWebhook.js
const express = require("express");
const crypto = require("crypto");

const router = express.Router();

// OJO: para validar firma necesitamos el RAW body.
// Por eso montaremos este router con express.json({ verify }) en el server.
function verifyMetaSignature(req, res, buf) {
  req.rawBody = buf; // guardamos raw body
}

function isValidSignature(req) {
  const appSecret = process.env.META_APP_SECRET;
  const signature = req.get("X-Hub-Signature-256"); // "sha256=..."
  if (!appSecret || !signature || !req.rawBody) return false;

  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(req.rawBody)
    .digest("hex");

  const received = signature.replace("sha256=", "");
  // compare timing-safe
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(received, "hex")
  );
}

// 1) Verificación del webhook (GET)
router.get("/webhook/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

 if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {

    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// 2) Recepción de eventos (POST)
router.post("/webhook/whatsapp", (req, res) => {
  // Si quieres validar firma (recomendado):
  if (!isValidSignature(req)) {
    return res.sendStatus(401);
  }

  const body = req.body;

  // WhatsApp manda eventos en body.entry[...]
  try {
    // Aquí luego conectamos con tu chatHandler/flujo MyClarix
    // Por ahora: log mínimo
    console.log("WA webhook event:", JSON.stringify(body));

    return res.sendStatus(200);
  } catch (e) {
    console.error("WA webhook error:", e);
    return res.sendStatus(200); // Meta recomienda 200 para no reintentar infinito
  }
});

module.exports = { router, verifyMetaSignature };
