// routes/appointmentRoutes.js

const express = require("express");
const {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment,
} = require("../controllers/appointmentController");

const router = express.Router();

// Crear cita: POST /api/appointments
router.post("/", createAppointment);

// Listar citas: GET /api/appointments?clientId=...
router.get("/", getAppointments);

// Actualizar cita: PUT /api/appointments/:id
router.put("/:id", updateAppointment);

// Eliminar cita: DELETE /api/appointments/:id
router.delete("/:id", deleteAppointment);

module.exports = router;


