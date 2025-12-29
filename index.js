require("dotenv").config();
const express = require("express");
const cors = require("cors");

const chatRoutes = require("./routes/chatRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const metricsRoutes = require("./routes/metricsRoutes");
const gaTestRoutes = require("./routes/gaTest");

// (Opcional) WhatsApp luego
// const whatsappRoutes = require("./routes/whatsappRoutes");

const app = express();
const PORT = process.env.PORT || 10000;

// ----------------------
// ✅ CORS (seguro + configurable)
// ----------------------
const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes("*")) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("CORS blocked: " + origin));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-client-id", "x-company-id"],
  credentials: false,
};

app.use(cors(corsOptions));

// ✅ Preflight para todas las rutas (NO usar "*")
app.options(/.*/, cors(corsOptions));

app.use(express.json());

// ----------------------
// ✅ Healthcheck (para Render y para ti)
// ----------------------
app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "myclarix-backend",
    time: new Date().toISOString(),
  });
});

// ----------------------
// ✅ Home
// ----------------------
app.get("/", (req, res) => {
  res.send("Lumina backend (MyClarix) está corriendo correctamente 🚀");
});

// ----------------------
// ✅ Routes
// ----------------------
app.use("/api/chat", chatRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api", gaTestRoutes);

// (Opcional) WhatsApp luego
// app.use("/api/whatsapp", whatsappRoutes);

// ----------------------
// ✅ 404 fallback (SIN "*")
// ----------------------
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Lumina escuchando en el puerto ${PORT}`);
});
