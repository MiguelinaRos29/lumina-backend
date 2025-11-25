// services/intentDetection.js

function detectarIntencion(message) {
  const texto = message.toLowerCase();

  if (texto.includes("cita") && (texto.includes("reservar") || texto.includes("quiero"))) {
    return "crear_cita";
  }

  if (texto.includes("mis citas") || texto.includes("tengo cita")) {
    return "listar_citas";
  }

  if ((texto.includes("cambia") || texto.includes("reprogram")) && texto.includes("cita")) {
    return "reprogramar_cita";
  }

  if (texto.includes("cancel") && texto.includes("cita")) {
    return "cancelar_cita";
  }

  return "normal";
}

module.exports = { detectarIntencion };
