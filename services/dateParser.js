// services/dateParser.js

function parseFechaDesdeMensaje(message) {
  const texto = message.toLowerCase().trim();
  const ahora = new Date();

  // 1) "mañana a las 16:00"
  if (texto.includes("mañana")) {
    const matchHora = texto.match(/(\d{1,2})[:\.](\d{2})/);
    if (matchHora) {
      const horas = parseInt(matchHora[1], 10);
      const minutos = parseInt(matchHora[2], 10);

      const fecha = new Date();
      fecha.setDate(fecha.getDate() + 1);
      fecha.setHours(horas);
      fecha.setMinutes(minutos);
      fecha.setSeconds(0);
      fecha.setMilliseconds(0);

      return fecha;
    }
  }

  // 2) "hoy a las 10:30"
  if (texto.includes("hoy")) {
    const matchHora = texto.match(/(\d{1,2})[:\.](\d{2})/);
    if (matchHora) {
      const horas = parseInt(matchHora[1], 10);
      const minutos = parseInt(matchHora[2], 10);

      const fecha = new Date();
      fecha.setHours(horas);
      fecha.setMinutes(minutos);
      fecha.setSeconds(0);
      fecha.setMilliseconds(0);

      return fecha;
    }
  }

  // 3) "el 15/01/2026 a las 16:00" o "15/01/2026 16:00"
  let matchCompleto = texto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}).*(\d{1,2})[:\.](\d{2})/);
  if (matchCompleto) {
    const dia = parseInt(matchCompleto[1], 10);
    const mes = parseInt(matchCompleto[2], 10) - 1; // 0-11
    const anio = parseInt(matchCompleto[3], 10);
    const horas = parseInt(matchCompleto[4], 10);
    const minutos = parseInt(matchCompleto[5], 10);

    const fecha = new Date(anio, mes, dia, horas, minutos, 0, 0);
    return fecha;
  }

  // 4) "15/01 a las 16:00" (asumimos año actual)
  let matchSinAnio = texto.match(/(\d{1,2})\/(\d{1,2}).*(\d{1,2})[:\.](\d{2})/);
  if (matchSinAnio) {
    const dia = parseInt(matchSinAnio[1], 10);
    const mes = parseInt(matchSinAnio[2], 10) - 1;
    const anio = ahora.getFullYear();
    const horas = parseInt(matchSinAnio[3], 10);
    const minutos = parseInt(matchSinAnio[4], 10);

    const fecha = new Date(anio, mes, dia, horas, minutos, 0, 0);
    return fecha;
  }

  // Si no entendemos la fecha, devolvemos null
  return null;
}

module.exports = { parseFechaDesdeMensaje };
