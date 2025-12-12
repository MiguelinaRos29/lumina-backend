/**
 * Parser de fechas y horas en lenguaje natural (VERSIÓN MEJORADA)
 * Devuelve:
 *   Date (objeto fecha con hora local)
 * o null si no puede entenderlo.
 */

function normalizarTexto(texto = "") {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const MESES = {
  enero: 0,
  feb: 1,
  febrero: 1,
  mar: 2,
  marzo: 2,
  abr: 3,
  abril: 3,
  mayo: 4,
  jun: 5,
  junio: 5,
  jul: 6,
  julio: 6,
  ago: 7,
  agosto: 7,
  sep: 8,
  septiembre: 8,
  setiembre: 8,
  oct: 9,
  octubre: 9,
  nov: 10,
  noviembre: 10,
  dic: 11,
  diciembre: 11,
};

/**
 * Extrae una hora del texto.
 * Soporta:
 *  - "a las 10"
 *  - "a las 10:30" / "10:30" / "10.30"
 *  - "a las 14h" / "14h"
 *  - "sobre las 7 y media" (aprox :30)
 *  - "9pm" / "9 pm" / "9am"
 *
 * Importante: evita capturar números que NO sean hora (ej: "tengo 2 hijas")
 */
function extraerHora(texto) {
  // 1) Formatos tipo 10:30 o 10.30
  let match = texto.match(/\b(\d{1,2})[:\.](\d{2})\b/);
  if (match) {
    let horas = parseInt(match[1], 10);
    let minutos = parseInt(match[2], 10);
    if (horas >= 0 && horas <= 23 && minutos >= 0 && minutos <= 59) {
      return { horas, minutos };
    }
  }

  // 2) "9pm" / "9 pm" / "9am" / "9 am"
  match = texto.match(/\b(\d{1,2})\s*(am|pm)\b/);
  if (match) {
    let horas = parseInt(match[1], 10);
    const mer = match[2];
    if (horas >= 1 && horas <= 12) {
      if (mer === "pm" && horas !== 12) horas += 12;
      if (mer === "am" && horas === 12) horas = 0;
      return { horas, minutos: 0 };
    }
  }

  // 3) "14h" o "21h" (con o sin espacio)
  match = texto.match(/\b(\d{1,2})\s*h\b/);
  if (match) {
    let horas = parseInt(match[1], 10);
    if (horas >= 0 && horas <= 23) {
      return { horas, minutos: 0 };
    }
  }

  // 4) "a las 10", "a la 7", "sobre las 8"
  //    Nota: aquí NO usamos "las 10" suelto sin preposición para evitar falsos positivos.
  match = texto.match(/\b(?:a las|a la|sobre las|sobre la)\s+(\d{1,2})\b/);
  if (match) {
    let horas = parseInt(match[1], 10);
    if (horas >= 0 && horas <= 23) {
      return { horas, minutos: 0 };
    }
  }

  // 5) "a las 7 y media" / "a las 7 y cuarto" / "sobre las 7 y media"
  match = texto.match(
    /\b(?:a las|a la|sobre las|sobre la)\s+(\d{1,2})\s*(?:y\s*)?(media|cuarto)\b/
  );
  if (match) {
    let horas = parseInt(match[1], 10);
    let tipo = match[2];
    let minutos = tipo === "media" ? 30 : 15;
    if (horas >= 0 && horas <= 23) {
      return { horas, minutos };
    }
  }

  return null;
}

/**
 * Calcula la fecha base (hoy, mañana, pasado mañana, día de la semana...)
 */
function calcularFechaBase(textoNormalizado) {
  const ahora = new Date();
  const base = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate(),
    0,
    0,
    0,
    0
  );

  if (textoNormalizado.includes("pasado manana")) {
    base.setDate(base.getDate() + 2);
    return base;
  }

  if (textoNormalizado.includes("manana")) {
    base.setDate(base.getDate() + 1);
    return base;
  }

  if (textoNormalizado.includes("hoy")) {
    return base;
  }

  // días de la semana
  const dias = [
    "domingo",
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
  ];

  for (let i = 0; i < dias.length; i++) {
    const d = dias[i];
    if (textoNormalizado.includes(d)) {
      const indiceReal = i; // domingo=0 ... sabado=6
      const hoy = ahora.getDay();
      let diff = indiceReal - hoy;
      if (diff <= 0) diff += 7;
      base.setDate(base.getDate() + diff);
      return base;
    }
  }

  // Si no encontramos nada, devolvemos hoy por defecto
  return base;
}

/**
 * Detecta fechas explícitas tipo:
 * - "12 de diciembre" (opcional año)
 * - "12/12/2025" o "12-12-25"
 */
function extraerFechaExplicita(texto) {
  // 1) 12 de diciembre de 2025
  let match = texto.match(/(\d{1,2})\s+de\s+([a-zñ]+)(?:\s+de\s+(\d{4}))?/i);
  if (match) {
    const dia = parseInt(match[1], 10);
    const mesNombre = match[2];
    const anio = match[3] ? parseInt(match[3], 10) : new Date().getFullYear();
    const mes = MESES[mesNombre];
    if (mes !== undefined && dia >= 1 && dia <= 31) {
      return new Date(anio, mes, dia, 0, 0, 0, 0);
    }
  }

  // 2) 12/12/2025 o 12-12-2025
  match = texto.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (match) {
    const dia = parseInt(match[1], 10);
    const mes = parseInt(match[2], 10) - 1;
    let anio = parseInt(match[3], 10);
    if (anio < 100) anio += 2000;
    if (dia >= 1 && dia <= 31 && mes >= 0 && mes <= 11) {
      return new Date(anio, mes, dia, 0, 0, 0, 0);
    }
  }

  return null;
}

/**
 * Función principal:
 *   parseFechaDesdeMensaje(mensaje) -> Date | null
 */
function parseFechaDesdeMensaje(message = "") {
  const texto = normalizarTexto(message);
  if (!texto) return null;

  // 1) Fecha explícita si existe
  let fecha = extraerFechaExplicita(texto);

  // 2) Si no, usar base (hoy / mañana / viernes...)
  if (!fecha) {
    fecha = calcularFechaBase(texto);
  }

  // 3) Hora
  const horaObj = extraerHora(texto);
  if (horaObj) {
    fecha.setHours(horaObj.horas);
    fecha.setMinutes(horaObj.minutos);
  } else {
    // Por defecto: 10:00
    fecha.setHours(10);
    fecha.setMinutes(0);
  }

  fecha.setSeconds(0);
  fecha.setMilliseconds(0);

  return fecha instanceof Date && !isNaN(fecha) ? fecha : null;
}

module.exports = {
  parseFechaDesdeMensaje,
};

