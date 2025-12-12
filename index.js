// index.js – Backend unificado limpio

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const chatRoutes = require("./routes/chatRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Lumina backend (MyClarix) está corriendo correctamente 🚀");
});

// ✅ Montar rutas correctas
app.use("/api/chat", chatRoutes);
app.use("/api/appointments", appointmentRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor Lumina escuchando en el puerto ${PORT}`);
});

