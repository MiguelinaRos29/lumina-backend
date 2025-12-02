// src/utils/dateParser.js
const chrono = require('chrono-node');

/**
 * Extrae fecha y hora desde un texto en español.
 * Ejemplos:
 *  - "apúntame mañana a las 4"
 *  - "reserva el martes a las 10"
 *  - "quiero una cita el 15 a las 18:00"
 */
function extraerFechaHoraDesdeTexto(texto) {
  try {
    const fecha = chrono.es.parseDate(texto, new Date());
    return fecha || null;
  } catch (error) {
    console.error("Error al analizar fecha:", error);
    return null;
  }
}

module.exports = {
  extraerFechaHoraDesdeTexto,
};
