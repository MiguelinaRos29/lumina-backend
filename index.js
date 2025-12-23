require("dotenv").config();
const express = require("express");
const cors = require("cors");

const chatRoutes = require("./routes/chatRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const gaTestRoutes = require("./routes/gaTest"); // ✅ AÑADIR

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Lumina backend (MyClarix) está corriendo correctamente 🚀");
});

app.use("/api/chat", chatRoutes);
app.use("/api/appointments", appointmentRoutes);

const metricsRoutes = require("./routes/metricsRoutes");
app.use("/api/metrics", metricsRoutes);

// ✅ AQUÍ VA (esto crea /api/ga-test)
app.use("/api", gaTestRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor Lumina escuchando en el puerto ${PORT}`);
});
