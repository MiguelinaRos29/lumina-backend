// services/appointmentState.js

// Mapa en memoria: clientId -> { appointmentId, fecha, hora }
const awaitingPurposeByClientId = new Map();

/**
 * Marca que un clientId tiene una cita recién creada
 * a la que hay que añadirle el "proposito" en el siguiente mensaje.
 */
function setAwaitingPurpose(clientId, data) {
  if (!clientId || !data || !data.appointmentId) return;

  awaitingPurposeByClientId.set(clientId, {
    appointmentId: data.appointmentId,
    fecha: data.fecha,
    hora: data.hora,
  });

  console.log("⏳ [appointmentState] Esperando motivo para:", clientId, data);
}

/**
 * Obtiene el estado de "esperando motivo"
 */
function getAwaitingPurpose(clientId) {
  return awaitingPurposeByClientId.get(clientId) || null;
}

/**
 * Limpia el estado de "esperando motivo"
 */
function clearAwaitingPurpose(clientId) {
  awaitingPurposeByClientId.delete(clientId);
  console.log("🧹 [appointmentState] Limpiado estado para:", clientId);
}

module.exports = {
  setAwaitingPurpose,
  getAwaitingPurpose,
  clearAwaitingPurpose,
};
