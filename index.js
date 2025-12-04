// index.js – Backend unificado limpio

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const chatController = require("./controllers/chatcontroller");
const appointmentRoutes = require("./routes/appointmentRoutes");

const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Lumina backend (MyClarix) está corriendo correctamente 🚀");
});

// Chat
app.post("/api/chat", chatController);

// Rutas de citas
// POST /api/appointments
// GET  /api/appointments?clientId=...
// PUT  /api/appointments/:id
// DELETE /api/appointments/:id
app.use("/api/appointments", appointmentRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor Lumina escuchando en el puerto ${PORT}`);
});
