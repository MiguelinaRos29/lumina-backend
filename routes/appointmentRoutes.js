// routes/appointmentRoutes.js

const express = require("express");
const router = express.Router();

const {
  crearCita,
  actualizarCita,
  obtenerCitas,
} = require("../controllers/appointmentController");

// POST /api/appointments → crear nueva cita
router.post("/", crearCita);

// PUT /api/appointments/:id → actualizar cita existente
router.put("/:id", actualizarCita);

// GET /api/appointments?clientId=... → listar citas de un cliente
router.get("/", obtenerCitas);

module.exports = router;


