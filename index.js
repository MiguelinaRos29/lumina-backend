// index.js (backend unificado)

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Rutas API
const chatRoutes = require("./routes/chatRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");

app.get('/', (req, res) => {
  res.send('Lumina backend (MyClarix) está corriendo correctamente 🚀');
});

app.use("/api/chat", chatRoutes);
app.use("/api/appointments", appointmentRoutes);

// Servir panel web
app.use(express.static("public"));

// Puerto dinámico para Render, 4000 para local
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor Lumina escuchando en el puerto ${PORT}`);
});
