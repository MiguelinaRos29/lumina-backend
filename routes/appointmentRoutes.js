const express = require("express");
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment
} = require("../controllers/appointmentController");

router.post("/", createAppointment);
router.get("/", getAppointments);
router.put("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);

module.exports = router;
