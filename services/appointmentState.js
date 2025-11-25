// services/appointmentState.js

// Estado simple en memoria por cliente
const estadoCitas = new Map();
// clientId => "esperando_fecha" | null

function setEstadoCita(clientId, estado) {
  estadoCitas.set(clientId, estado);
}

function getEstadoCita(clientId) {
  return estadoCitas.get(clientId) || null;
}

function limpiarEstadoCita(clientId) {
  estadoCitas.delete(clientId);
}

module.exports = {
  setEstadoCita,
  getEstadoCita,
  limpiarEstadoCita,
};
