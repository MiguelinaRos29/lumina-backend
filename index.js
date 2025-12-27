require("dotenv").config();
const express = require("express");
const cors = require("cors");

const chatRoutes = require("./routes/chatRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const metricsRoutes = require("./routes/metricsRoutes");
const gaTestRoutes = require("./routes/gaTest");

// (Opcional) si luego lo usas:
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
    // Permite requests sin origin (Postman, curl, server-to-server)
    if (!origin) return cb(null, true);

    // Si usas "*", dejamos pasar todo
    if (allowedOrigins.includes("*")) return cb(null, true);

    // Si está en la lista, ok
    if (allowedOrigins.includes(origin)) return cb(null, true);

    return cb(new Error("CORS blocked: " + origin));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-client-id", "x-company-id"],
  credentials: false,
};

app.use(cors(corsOptions));

// ✅ Preflight para TODAS las rutas (IMPORTANTE)
// En algunos setups nuevos, "*" rompe. Usamos regex /.*/ (no rompe).
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
// ✅ Rutas actuales (igual que las tuyas)
// ----------------------
app.get("/", (req, res) => {
  res.send("Lumina backend (MyClarix) está corriendo correctamente 🚀");
});

app.use("/api/chat", chatRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/metrics", metricsRoutes);

// ✅ ruta de prueba GA4 (/api/ga-test etc)
app.use("/api", gaTestRoutes);

// (Opcional) WhatsApp luego
// app.use("/api/whatsapp", whatsappRoutes);

// ----------------------
// ✅ Fallback 404 (sin usar "*")
// ----------------------
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Lumina escuchando en el puerto ${PORT}`);
});
