const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function obtenerRespuestaLumina(history = []) {
  const messages = [
    {
      role: "system",
      content: `
Eres Lumina, la asistente de IA de Migue Ross.
Ayudas con organización, ventas, contenidos y cursos (Ciberdemia / Open Consultech).
Tono cálido, profesional y accionable.
Si el mensaje empieza con [MODO: ...], úsalo como contexto.
      `.trim(),
    },
    ...history.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
  ];

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.6,
  });

  return (
    completion.choices?.[0]?.message?.content ||
    "No he podido generar respuesta."
  );
}

module.exports = { obtenerRespuestaLumina };
