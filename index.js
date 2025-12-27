// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const chatRoutes = require("./routes/chatRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const metricsRoutes = require("./routes/metricsRoutes");
const gaTestRoutes = require("./routes/gaTest");

// (opcional) WhatsApp routes si ya los tienes creados
// const whatsappRoutes = require("./routes/whatsappRoutes");

const app = express();

// Render suele ir detrás de proxy
app.set("trust proxy", 1);

// ----------------------
// ✅ CORS (controlable desde Render)
// ----------------------
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// Si pones "*" se permite todo. Si pones dominio, se restringe.
// Ejemplo recomendado:
// CORS_ORIGIN=https://myclarix.com,https://www.myclarix.com,https://app.myclarix.com
const allowedOrigins = CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // requests sin origin (Postman, server-to-server)
      if (!origin) return cb(null, true);

      // modo abierto
      if (allowedOrigins.includes("*")) return cb(null, true);

      // modo lista blanca
      if (allowedOrigins.includes(origin)) return cb(null, true);

      return cb(new Error("CORS bloqueado: origen no permitido"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-client-id", "x-company-id"],
  })
);

// Para preflight
app.options("*", cors());

app.use(express.json());

// ----------------------
// ✅ Rutas base
// ----------------------
app.get("/", (req, res) => {
  res.status(200).send(
    "Lumina backend (MyClarix) está corriendo correctamente 🚀\n" +
      "OK endpoints: /health  /api/chat  /api/appointments  /api/metrics  /api/ga-test"
  );
});

// ✅ Health check real
app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "lumina-backend",
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});

// ----------------------
// ✅ API Routes (tal cual las tienes)
// ----------------------
app.use("/api/chat", chatRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/metrics", metricsRoutes);

// ✅ ruta de prueba GA4 (según tu archivo gaTest.js)
app.use("/api", gaTestRoutes);

// (opcional) WhatsApp
// app.use("/api/whatsapp", whatsappRoutes);

// ----------------------
// ✅ 404 controlado
// ----------------------
app.use((req, res) => {
  return res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

// ----------------------
// ✅ Start server
// ----------------------
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor Lumina escuchando en el puerto ${PORT}`);
});
