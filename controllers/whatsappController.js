const { handleIncomingMessage } = require("./chatController");

// (Opcional más tarde) enviar respuesta real por WhatsApp Cloud API
async function sendWhatsAppText({ to, text }) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // Si aún no tenemos token/phoneId (Meta no te deja), no fallamos:
  if (!token || !phoneId) {
    console.log("[WA] No token/phoneId todavía. Respuesta simulada:", { to, text });
    return { simulated: true };
  }

  const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  const data = await resp.json();
  if (!resp.ok) {
    console.error("[WA] Error send:", data);
  }
  return data;
}

// ✅ GET verificación (hub.challenge)
function verifyWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token && expected && token === expected) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
}

// ✅ POST recepción
async function receiveWebhook(req, res) {
  try {
    const body = req.body;

    // Meta espera 200 rápido
    res.sendStatus(200);

    // Parse básico de WhatsApp Cloud API
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const messages = value?.messages || [];
    if (!messages.length) return;

    for (const m of messages) {
      const from = m.from; // wa_id del usuario
      const text = m?.text?.body;

      if (!from || !text) continue;

      // clientId estable desde WhatsApp
      const clientId = `wa_${from}`;

      const reply = await handleIncomingMessage({
        req: null, // aquí no tenemos req real de app; puedes pasar uno dummy si quieres GA server-side
        clientId,
        message: text,
        mode: "whatsapp",
      });

      await sendWhatsAppText({ to: from, text: reply });
    }
  } catch (err) {
    console.error("[WA] webhook error:", err);
  }
}

module.exports = { verifyWebhook, receiveWebhook };
