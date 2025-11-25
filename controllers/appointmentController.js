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
  limpiarEstadoCita
} = require("../services/appointmentState");

// Crear una nueva cita
exports.createAppointment = async (req, res) => {
  try {
    const { clientId, fecha, hora, duracion, proposito } = req.body;

    if (!clientId || !fecha || !hora) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: clientId, fecha, hora."
      });
    }

    const nuevaCita = await crearCita({
      clientId,
      fecha,
      hora,
      duracion,
      proposito
    });

    // Reseteamos estado conversacional
    limpiarEstadoCita(clientId);

    res.status(201).json({
      message: "Cita creada correctamente",
      cita: nuevaCita
    });

  } catch (error) {
    console.error("❌ Error al crear cita:", error);
    res.status(500).json({ error: "Error al crear cita" });
  }
};

// Obtener citas (del cliente o todas)
exports.getAppointments = async (req, res) => {
  try {
    const { clientId } = req.query;

    const citas = await obtenerCitas(clientId);

    res.json(citas);
  } catch (error) {
    console.error("❌ Error al obtener citas:", error);
    res.status(500).json({ error: "Error al obtener citas" });
  }
};

// Actualizar una cita
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;

    const citaActualizada = await actualizarCita(id, datos);

    if (!citaActualizada) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    res.json({
      message: "Cita actualizada correctamente",
      cita: citaActualizada
    });

  } catch (error) {
    console.error("❌ Error al actualizar cita:", error);
    res.status(500).json({ error: "Error al actualizar cita" });
  }
};

// Eliminar cita
exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await eliminarCita(id);

    if (!resultado) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    res.json({ message: "Cita eliminada correctamente" });

  } catch (error) {
    console.error("❌ Error al eliminar cita:", error);
    res.status(500).json({ error: "Error al eliminar cita" });
  }
};
