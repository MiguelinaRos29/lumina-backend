// services/luminaAI.js
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Obtener respuesta de Lumina
 * @param {string} message  Mensaje actual del usuario
 * @param {string} mode     Modo rápido (organización, ventas, contenidos, ciberdemia, etc.)
 * @param {Array}  history  Historial previo [{ role, content }]
 */
async function obtenerRespuestaLumina(message, mode, history = []) {
  try {
    // Si viene modo, se lo añadimos al contenido del usuario
    const userContent =
      mode && typeof mode === "string"
        ? `[MODO: ${mode}] ${message}`
        : message;

    const messages = [
      {
        role: "system",
        content: `
Eres Lumina, la asistente de IA de Migue Ross.
Ayudas con organización, ventas, contenidos y cursos (Ciberdemia / Open Consultech).
Tono cálido, profesional y accionable.
Si el mensaje incluye algo como [MODO: ...], úsalo como contexto de intención del usuario.
Responde siempre en español neutro, salvo que el usuario pida otro idioma.
`.trim(),
      },
      // Historial guardado en base de datos
      ...history.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
      // Mensaje actual del usuario
      {
        role: "user",
        content: userContent,
      },
    ];

    const completion = await groq.chat.completions.create({
      // Usa el mismo modelo que ya tenías funcionando
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.5,
      max_tokens: 1024,
    });

    return (
      completion?.choices?.[0]?.message?.content?.trim() ||
      "Lo siento, no pude generar una respuesta en este momento."
    );
  } catch (error) {
    console.log("🔎 Llamando a Groq con clientId:", clientId);
    console.error("❌ Error en obtenerRespuestaLumina:", error);
    throw error;
  }
}

module.exports = { obtenerRespuestaLumina };
function detectarIntencion(message) {
  const texto = message.toLowerCase();

  if (texto.includes("cita") && (texto.includes("reservar") || texto.includes("quiero"))) {
    return "crear_cita";
  }

  if (texto.includes("cambia") || texto.includes("reprogram")) {
    return "reprogramar_cita";
  }

  if (texto.includes("cancel") && texto.includes("cita")) {
    return "cancelar_cita";
  }

  if (texto.includes("mis citas") || texto.includes("tengo cita")) {
    return "listar_citas";
  }

  return "normal";
}
