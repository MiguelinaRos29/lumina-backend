// services/dateParser.js

/**
 * Convierte nombres de meses en español a número de mes (0-11)
 */
function mesTextoANumero(nombreMes = "") {
  const m = nombreMes.toLowerCase().trim();

  const meses = {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    setiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11,
  };

  return meses[m] ?? null;
}

/**
 * Intenta extraer hora y minutos de un texto.
 * Devuelve { horas, minutos } o null si no encuentra nada.
 */
function extraerHora(texto = "") {
  const t = texto.toLowerCase();

  // Ejemplos: "16:00", "9:30", "9.30"
  let match = t.match(/(\d{1,2})[:\.](\d{2})/);
  if (match) {
    const horas = parseInt(match[1], 10);
    const minutos = parseInt(match[2], 10);
    if (horas >= 0 && horas <= 23 && minutos >= 0 && minutos <= 59) {
      return { horas, minutos };
    }
  }

  // Ejemplo: "a las 10", "a las 9"
  match = t.match(/a las (\d{1,2})\b/);
  if (match) {
    const horas = parseInt(match[1], 10);
    if (horas >= 0 && horas <= 23) {
      return { horas, minutos: 0 };
    }
  }

  return null;
}

/**
 * Intenta interpretar una fecha desde el mensaje del usuario.
 * Devuelve un objeto Date o null si no reconoce nada.
 */
function parseFechaDesdeMensaje(message = "") {
  const texto = message.toLowerCase().trim();
  const ahora = new Date();

  // =========================
  // 1) "mañana a las 16:00"
  // =========================
  if (texto.includes("mañana")) {
    const fecha = new Date();
    fecha.setDate(ahora.getDate() + 1);

    const hora = extraerHora(texto);
    if (hora) {
      fecha.setHours(hora.horas);
      fecha.setMinutes(hora.minutos);
    } else {
      // Si no se indica hora, por defecto 10:00
      fecha.setHours(10);
      fecha.setMinutes(0);
    }

    fecha.setSeconds(0);
    fecha.setMilliseconds(0);

    return fecha;
  }

  // =========================
  // 2) "hoy a las 10:00"
  // =========================
  if (texto.includes("hoy")) {
    const fecha = new Date();

    const hora = extraerHora(texto);
    if (hora) {
      fecha.setHours(hora.horas);
      fecha.setMinutes(hora.minutos);
    } else {
      // Si no se indica hora, por defecto 10:00
      fecha.setHours(10);
      fecha.setMinutes(0);
    }

    fecha.setSeconds(0);
    fecha.setMilliseconds(0);

    return fecha;
  }

  // ==========================================
  // 3) Fechas tipo "5/12/2025" o "5-12-2025"
  //    También admite sin año: "5/12"
  // ==========================================
  let match = texto.match(
    /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/
  );
  if (match) {
    const dia = parseInt(match[1], 10);
    const mes = parseInt(match[2], 10) - 1; // JS usa 0-11
    let anio = parseInt(match[3], 10);

    if (isNaN(anio)) {
      anio = ahora.getFullYear();
    } else if (anio < 100) {
      // por si ponen "25" en lugar de "2025"
      anio = 2000 + anio;
    }

    const fecha = new Date(anio, mes, dia);

    const hora = extraerHora(texto);
    if (hora) {
      fecha.setHours(hora.horas);
      fecha.setMinutes(hora.minutos);
    } else {
      fecha.setHours(10);
      fecha.setMinutes(0);
    }

    fecha.setSeconds(0);
    fecha.setMilliseconds(0);

    if (!isNaN(fecha.getTime())) {
      return fecha;
    }
  }

  // ===========================================================
  // 4) Fechas tipo "5 de diciembre de 2025" o "5 de diciembre"
  //    Ejemplo del propio proyecto: "el día 5 de diciembre..."
  // ===========================================================
  match = texto.match(
    /(\d{1,2})\s+de\s+([a-zñ]+)(?:\s+de\s+(\d{4}))?/
  );
  if (match) {
    const dia = parseInt(match[1], 10);
    const nombreMes = match[2];
    const numMes = mesTextoANumero(nombreMes);
    let anio = parseInt(match[3], 10);

    if (numMes !== null) {
      if (isNaN(anio)) {
        anio = ahora.getFullYear();
      }

      const fecha = new Date(anio, numMes, dia);

      const hora = extraerHora(texto);
      if (hora) {
        fecha.setHours(hora.horas);
        fecha.setMinutes(hora.minutos);
      } else {
        // si no se menciona la hora, por defecto 10:00
        fecha.setHours(10);
        fecha.setMinutes(0);
      }

      fecha.setSeconds(0);
      fecha.setMilliseconds(0);

      if (!isNaN(fecha.getTime())) {
        return fecha;
      }
    }
  }

  // Si no reconoce nada, devuelve null
  return null;
}

module.exports = {
  parseFechaDesdeMensaje,
};
