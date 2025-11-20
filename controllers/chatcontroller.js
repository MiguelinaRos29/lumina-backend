const { obtenerRespuestaLumina } = require("../services/luminaAI.js");

async function chatcontroller(req, res) {
  try {
    const { message, history, clientId } = req.body;

    console.log("📩 Mensaje recibido en /api/chat");
    console.log("Último mensaje:", message);
    console.log("Historial:", Array.isArray(history) ? history.length : "no array");
    if (clientId) console.log("clientId:", clientId);

    const safeHistory = Array.isArray(history) ? history : [];

    const reply = await obtenerRespuestaLumina(safeHistory);

    return res.json({ reply });
  } catch (error) {
    console.error("❌ Error en chatcontroller:", error);
    return res.status(500).json({
      reply: "⚠️ Ha ocurrido un error al llamar a la IA de Lumina.",
    });
  }
}

module.exports = { chatcontroller };



