// index.js – Backend unificado limpio

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const chatController = require("./controllers/chatcontroller");
const { listAppointments } = require("./controllers/appointmentController");

const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Lumina/MyClarix backend está corriendo");
});

// Chat
app.post("/api/chat", chatController);

// Obtener citas
app.get("/api/appointments", listAppointments);

app.listen(PORT, () => {
  console.log(`🚀 Servidor Lumina escuchando en el puerto ${PORT}`);
});
