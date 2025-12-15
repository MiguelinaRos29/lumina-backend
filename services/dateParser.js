// services/dateParser.js
// Parser robusto para fechas/horas en español (LOCAL TIME)
// Devuelve Date o null

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
  may: 4,
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

function clampHora(h) {
  if (Number.isNaN(h)) return null;
  if (h < 0 || h > 23) return null;
  return h;
}

function clampMin(m) {
  if (Number.isNaN(m)) return 0;
  if (m < 0 || m > 59) return 0;
  return m;
}

function extraerHora(texto) {
  // "a las 19", "a las 19:30", "19:30", "19.30"
  const m = texto.match(/(?:a las\s*)?(\d{1,2})(?:[:\.](\d{2}))?/);
  if (!m) return null;

  const h = clampHora(parseInt(m[1], 10));
  if (h === null) return null;

  const min = clampMin(m[2] ? parseInt(m[2], 10) : 0);
  return { h, min };
}

function setHora(date, h, min) {
  const d = new Date(date);
  d.setHours(h, min, 0, 0);
  return d;
}

function parseFechaDesdeMensaje(message) {
  const raw = String(message || "");
  const texto = normalizarTexto(raw);
  const ahora = new Date();

  const hora = extraerHora(texto);
  if (!hora) return null;

  // 1) mañana
  if (texto.includes("manana")) {
    const d = new Date(ahora);
    d.setDate(d.getDate() + 1);
    return setHora(d, hora.h, hora.min);
  }

  // 2) pasado mañana
  if (texto.includes("pasado manana") || texto.includes("pasadomanana")) {
    const d = new Date(ahora);
    d.setDate(d.getDate() + 2);
    return setHora(d, hora.h, hora.min);
  }

  // 3) "el dia 16"
  const mDia = texto.match(/(?:el\s*)?dia\s*(\d{1,2})/);
  if (mDia) {
    const day = parseInt(mDia[1], 10);
    if (day >= 1 && day <= 31) {
      const d = new Date(ahora);
      d.setHours(0, 0, 0, 0);
      d.setDate(day);

      // Si ya pasó este mes, lo empujamos al siguiente
      if (d < new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())) {
        d.setMonth(d.getMonth() + 1);
      }

      return setHora(d, hora.h, hora.min);
    }
  }

  // 4) "16/12" o "16-12"
  const mDM = texto.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (mDM) {
    const day = parseInt(mDM[1], 10);
    const month = parseInt(mDM[2], 10) - 1;
    let year = mDM[3] ? parseInt(mDM[3], 10) : ahora.getFullYear();
    if (year < 100) year = 2000 + year;

    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      const d = new Date(year, month, day, 0, 0, 0, 0);
      return setHora(d, hora.h, hora.min);
    }
  }

  // 5) "16 de diciembre"
  const mDiaMes = texto.match(/(\d{1,2})\s+de\s+([a-zñ]+)/);
  if (mDiaMes) {
    const day = parseInt(mDiaMes[1], 10);
    const mesStr = mDiaMes[2];
    const month = MESES[mesStr];

    if (day >= 1 && day <= 31 && typeof month === "number") {
      let year = ahora.getFullYear();
      const d = new Date(year, month, day, 0, 0, 0, 0);

      // Si la fecha ya pasó este año, la ponemos al año siguiente
      if (d < new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())) {
        year += 1;
      }

      const d2 = new Date(year, month, day, 0, 0, 0, 0);
      return setHora(d2, hora.h, hora.min);
    }
  }

  // Si solo dicen hora ("a las 20") -> hoy si no pasó, si pasó -> mañana
  const today = setHora(ahora, hora.h, hora.min);
  if (today >= ahora) return today;

  const tomorrow = new Date(ahora);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return setHora(tomorrow, hora.h, hora.min);
}

/**
 * Extrae propósito premium:
 * - SOLO si viene con palabra gancho: por / para / porque / motivo: / sobre / acerca de
 * - Evita capturar basura tipo "mañana a las 20"
 */
function extraerProposito(message) {
  const texto = normalizarTexto(String(message || ""));

  // ✅ Solo consideramos propósito si aparece un “gancho”
  const m =
    texto.match(/\b(?:por|para|porque|motivo)\b\s*[:\-]?\s*(.+)$/) ||
    texto.match(/\b(?:sobre|acerca de)\b\s*(.+)$/);

  if (!m) return null;

  let p = String(m[1] || "").trim();
  if (!p) return null;

  // ✅ Limpieza: quitar restos de expresiones de tiempo si se cuelan
  p = p
    .replace(/\b(hoy|manana|mañana|pasado manana|pasado mañana|pasadomanana)\b/g, "")
    .replace(/\b(a las|a la)\b/g, "")
    .replace(/\b(\d{1,2})[:\.](\d{2})\b/g, "")
    .replace(/\b(\d{1,2})\b/g, "")
    .replace(/[,\.\-:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!p || p.length < 2) return null;

  return p.slice(0, 140);
}

module.exports = {
  parseFechaDesdeMensaje,
  extraerProposito,
};
