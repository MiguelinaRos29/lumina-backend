// controllers/appointmentController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function fechaToYMD(input) {
  if (!input) return null;

  // ✅ Caso 1: ya viene como "YYYY-MM-DD"
  if (typeof input === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

    // si viniera como ISO
    const d = new Date(input);
    if (!isNaN(d)) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return null;
  }

  // ✅ Caso 2: viene como Date
  if (input instanceof Date && !isNaN(input)) {
    const yyyy = input.getFullYear();
    const mm = String(input.getMonth() + 1).padStart(2, "0");
    const dd = String(input.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

async function crearCita(req, res) {
  try {
    const { clientId, fecha, hora, proposito, status } = req.body || {};

    if (!clientId || !fecha || !hora) {
      return res.status(400).json({ error: "clientId, fecha y hora son requeridos" });
    }

    const fechaYMD = fechaToYMD(fecha);
    if (!fechaYMD) return res.status(400).json({ error: "fecha inválida" });

    const cleanPurpose =
      typeof proposito === "string" && proposito.trim().length > 0
        ? proposito.trim().slice(0, 140)
        : null;

    const created = await prisma.appointment.create({
      data: {
        clientId: String(clientId),
        fecha: fechaYMD,
        hora: String(hora),
        status: status || "confirmed",
        proposito: cleanPurpose,
      },
    });

    return res.json({ appointment: created });
  } catch (err) {
    // ✅ si existe unique slot (clientId+fecha+hora), devolvemos mensaje amable
    if (err?.code === "P2002") {
      return res.status(409).json({
        error: "Ya existe una cita para esa fecha y hora. Dime otra hora.",
        details: err?.meta,
      });
    }
    console.error("crearCita error:", err);
    return res.status(500).json({ error: "Error interno del servidor", details: String(err?.message || err) });
  }
}

async function actualizarCita(req, res) {
  try {
    const { id } = req.params;
    const { status, proposito, fecha, hora } = req.body || {};

    if (!id) return res.status(400).json({ error: "id requerido" });

    const data = {};

    if (typeof status === "string" && status.trim()) data.status = status.trim();

    if (typeof proposito === "string") {
      const p = proposito.trim();
      data.proposito = p.length ? p.slice(0, 140) : null;
    }

    if (typeof fecha !== "undefined") {
      const fechaYMD = fechaToYMD(fecha);
      if (!fechaYMD) return res.status(400).json({ error: "fecha inválida" });
      data.fecha = fechaYMD;
    }

    if (typeof hora === "string" && hora.trim()) {
      data.hora = hora.trim();
    }

    const updated = await prisma.appointment.update({
      where: { id: String(id) },
      data,
    });

    return res.json({ appointment: updated });
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({
        error: "Ya existe una cita para esa fecha y hora. Dime otra hora.",
        details: err?.meta,
      });
    }
    console.error("actualizarCita error:", err);
    return res.status(500).json({ error: "Error interno del servidor", details: String(err?.message || err) });
  }
}

async function obtenerCitas(req, res) {
  try {
    const clientId = req.query.clientId ? String(req.query.clientId) : null;

    const where = clientId ? { clientId } : {};

    const rows = await prisma.appointment.findMany({
      where,
      orderBy: [{ fecha: "asc" }, { hora: "asc" }],
    });

    // ✅ añadimos fechaStr para agrupar en el móvil sin líos
    const appointments = rows.map((a) => ({
      ...a,
      fechaStr: fechaToYMD(a.fecha),
    }));

    return res.json({ appointments });
  } catch (err) {
    console.error("obtenerCitas error:", err);
    return res.status(500).json({ error: "Error interno del servidor", details: String(err?.message || err) });
  }
}

module.exports = {
  crearCita,
  actualizarCita,
  obtenerCitas,
};



