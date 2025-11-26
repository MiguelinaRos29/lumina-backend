// controllers/appointmentController.js

const {
  crearCita,
  obtenerCitas,
  actualizarCita,
  eliminarCita,
} = require("../services/appointmentService");

const {
  getEstadoCita,
  setEstadoCita,
  limpiarEstadoCita,
} = require("../services/appointmentState");

// ---------------------------------------------------------------------------
// Crear una nueva cita
// POST /api/appointments
// ---------------------------------------------------------------------------
exports.createAppointment = async (req, res) => {
  try {
    // 🧩 Contexto MyClarix (viene del middleware)
    const { clientId: ctxClientId, companyId } = req.context || {};

    // También aceptamos clientId en el body para compatibilidad
    const { clientId: bodyClientId, fecha, hora, duracion, proposito } = req.body;

    // Prioridad: contexto → body
    const clientId = ctxClientId || bodyClientId;

    console.log("📅 Contexto MyClarix en createAppointment:", {
      clientId,
      companyId,
    });

    if (!clientId || !fecha || !hora) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: clientId, fecha, hora.",
      });
    }

    const nuevaCita = await crearCita({
      clientId,
      fecha,
      hora,
      duracion,
      proposito,
      // 🔜 En el futuro puedes pasar companyId si lo añades al modelo:
      // companyId,
    });

    // Reseteamos estado conversacional de cita para este cliente
    limpiarEstadoCita(clientId);

    return res.status(201).json({
      message: "Cita creada correctamente",
      cita: nuevaCita,
    });
  } catch (error) {
    console.error("❌ Error al crear cita:", error);
    return res.status(500).json({ error: "Error al crear cita" });
  }
};

// ---------------------------------------------------------------------------
// Obtener citas (del cliente o todas)
// GET /api/appointments?clientId=XXXX
// ---------------------------------------------------------------------------
exports.getAppointments = async (req, res) => {
  try {
    // Contexto
    const { clientId: ctxClientId, companyId } = req.context || {};
    const { clientId: queryClientId } = req.query;

    const clientId = ctxClientId || queryClientId;

    console.log("📅 Contexto MyClarix en getAppointments:", {
      clientId,
      companyId,
    });

    const citas = await obtenerCitas(clientId /*, companyId */);

    return res.json(citas);
  } catch (error) {
    console.error("❌ Error al obtener citas:", error);
    return res.status(500).json({ error: "Error al obtener citas" });
  }
};

// ---------------------------------------------------------------------------
// Actualizar una cita
// PUT /api/appointments/:id
// ---------------------------------------------------------------------------
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;

    const citaActualizada = await actualizarCita(id, datos);

    if (!citaActualizada) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    return res.json({
      message: "Cita actualizada correctamente",
      cita: citaActualizada,
    });
  } catch (error) {
    console.error("❌ Error al actualizar cita:", error);
    return res.status(500).json({ error: "Error al actualizar cita" });
  }
};

// ---------------------------------------------------------------------------
// Eliminar cita
// DELETE /api/appointments/:id
// ---------------------------------------------------------------------------
exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await eliminarCita(id);

    if (!resultado) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    return res.json({ message: "Cita eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar cita:", error);
    return res.status(500).json({ error: "Error al eliminar cita" });
  }
};
