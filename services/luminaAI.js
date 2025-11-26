// services/luminaAI.js

const Groq = require("groq-sdk");

if (!process.env.GROQ_API_KEY) {
  console.warn("⚠ GROQ_API_KEY no está definida en las variables de entorno.");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

/**
 * Obtener respuesta de MyClarix / Lumina
 * @param {string} clientId  - Identificador del cliente/usuario
 * @param {string} message   - Mensaje del usuario
 * @param {string|null} mode - Modo de trabajo (normal, organización, ventas, etc.)
 * @returns {Promise<string>}
 */
async function obtenerRespuestaLumina(clientId, message, mode) {
  try {
    const modoTexto = (() => {
      switch (mode) {
        case "organizacion":
        case "Organización":
          return "Actúa como una asistente especializada en organización personal y productividad.";
        case "ventas":
          return "Actúa como una asistente enfocada en ventas, cierre de clientes y objeciones.";
        case "contenidos":
          return "Actúa como asistente creativa para redes sociales y creación de contenidos.";
        case "ciberdemia":
          return "Actúa como una experta en formación online, cursos y academia digital.";
        default:
          return "Eres MyClarix, una asistente inteligente amable, clara y práctica.";
      }
    })();

    const systemPrompt = `
${modoTexto}
Ten en cuenta que este usuario tiene el id: ${clientId}.
Responde siempre en español, con un tono cercano y profesional.
Si no tienes datos suficientes, pide aclaraciones de forma amable.
`;

   const completion = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: message,
    },
  ],
  temperature: 0.6,
  max_tokens: 500,
});


    const respuesta =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Lo siento, ahora mismo no puedo generar una respuesta útil.";

    return respuesta;
  } catch (error) {
    console.error("❌ Error en obtenerRespuestaLumina:", error);
    throw error; // lo captura chatcontroller y envía 500
  }
}

module.exports = {
  obtenerRespuestaLumina,
};
