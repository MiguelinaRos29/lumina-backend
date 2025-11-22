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
    console.error("❌ Error en obtenerRespuestaLumina:", error);
    throw error;
  }
}

module.exports = { obtenerRespuestaLumina };
