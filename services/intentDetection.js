// services/intentDetection.js

function normalizarTexto(texto = "") {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detecta motivo (muy simple por ahora)
 */
function detectarMotivo(texto = "") {
  const t = normalizarTexto(texto);

  if (t.includes("dolor")) return "Consulta por dolor";
  if (t.includes("asesor")) return "Asesoría";
  if (t.includes("documento")) return "Revisión de documentos";
  if (t.includes("curso")) return "Consulta sobre cursos";
  if (t.includes("ventas")) return "Consulta de ventas";

  return null;
}

/**
 * Analiza el mensaje y devuelve un tipo de intención
 *
 * Posibles respuestas:
 * - "CREAR_CITA"
 * - null
 */
function detectarIntencion(message = "") {
  const texto = normalizarTexto(message);
  if (!texto) return null;

  const palabrasCita = [
    "cita",
    "agendar",
    "agenda",
    "reservar",
    "reserva",
    "apuntame",
    "apuntame",
    "quiero una cita",
    "necesito una cita",
  ];

  const contieneCita = palabrasCita.some((p) => texto.includes(p));

  if (contieneCita) return "CREAR_CITA";

  return null;
}

module.exports = {
  detectarMotivo,
  detectarIntencion,
};
