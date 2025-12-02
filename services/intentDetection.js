// services/intentDetection.js

/**
 * Analiza el mensaje y devuelve un tipo de intención
 * 
 * Posibles respuestas:
 * - "CREAR_CITA"
 * - null  (si no detecta intención especial)
 */
function detectarIntencion(message) {
  if (!message) return null;

  const texto = message.toLowerCase();

  // Palabras que nos indican que quiere una cita
  const palabrasCita = ["cita", "agendar", "agenda", "reservar", "reserva", "apúntame", "apuntame"];

  const contieneCita = palabrasCita.some((p) => texto.includes(p));

  if (contieneCita) {
    return "CREAR_CITA";
  }

  return null;
}

module.exports = { detectarIntencion };
