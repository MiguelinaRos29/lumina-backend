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

// ----------------------------------------------------
// Crear una nueva cita   (POST /api/appointments)
// ----------------------------------------------------
async function createAppointment(req, res) {
  try {
    const { clientId, fecha, hora } = req.body;

    // Validación básica
    if (!clientId || !fecha || !hora) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: clientId, fecha, hora.",
      });
    }

    const nuevaCita = await crearCita({ clientId, fecha, hora });

    // Guardar estado en memoria (opcional)
    try {
      setEstadoCita(clientId, { ultimaCita: nuevaCita });
    } catch (e) {
      console.warn("No se pudo actualizar el estado de la cita en memoria:", e);
    }

    return res.status(201).json({
      success: true,
      appointment: nuevaCita,
    });
  } catch (error) {
    console.error("Error en createAppointment:", error);
    return res.status(500).json({ error: "Error al crear cita" });
  }
}

// ----------------------------------------------------
// Obtener citas   (GET /api/appointments?clientId=...)
// ----------------------------------------------------
async function getAppointments(req, res) {
  try {
    const { clientId } = req.query;

    const citas = await obtenerCitas(clientId);

    return res.status(200).json({
      success: true,
      appointments: citas,
    });
  } catch (error) {
    console.error("Error en getAppointments:", error);
    return res.status(500).json({ error: "Error al obtener citas" });
  }
}

// ----------------------------------------------------
// Actualizar cita   (PUT /api/appointments/:id)
// ----------------------------------------------------
async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const { fecha, hora, status } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Falta el id de la cita." });
    }

    const citaActualizada = await actualizarCita(id, { fecha, hora, status });

    return res.status(200).json({
      success: true,
      appointment: citaActualizada,
    });
  } catch (error) {
    console.error("Error en updateAppointment:", error);
    return res.status(500).json({ error: "Error al actualizar cita" });
  }
}

// ----------------------------------------------------
// Eliminar cita   (DELETE /api/appointments/:id)
// ----------------------------------------------------
async function deleteAppointment(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Falta el id de la cita." });
    }

    await eliminarCita(id);

    return res.status(200).json({
      success: true,
      message: "Cita eliminada correctamente",
    });
  } catch (error) {
    console.error("Error en deleteAppointment:", error);
    return res.status(500).json({ error: "Error al eliminar cita" });
  }
}

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment,
};
