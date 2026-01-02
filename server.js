require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

const { clientContext } = require("./clientContext.js");
const chatRoutes = require("./routes/chatRoutes.js");

// ✅ WhatsApp webhook router + verify
const {
  router: whatsappRouter,
  verifyMetaSignature,
} = require("./routes/whatsappWebhook.js");

const app = express();

// Render / proxies
app.set("trust proxy", 1);

// ----------------------
// 🟣 CORS
// ----------------------
const corsOrigin = process.env.CORS_ORIGIN || "*";

app.use(
  cors({
    origin: corsOrigin === "*" ? "*" : corsOrigin.split(",").map((s) => s.trim()),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-client-id", "x-company-id"],
  })
);

// ✅ 1) RAW body SOLO para el webhook de WhatsApp
app.post(
  "/api/webhook/whatsapp",
  express.json({ verify: verifyMetaSignature })
);

// ✅ 2) JSON normal para TODO lo demás
app.use(express.json());
app.use(clientContext);

app.use(express.static(path.join(__dirname, "public")));

// ✅ HEALTH CHECKS
app.get("/health", (req, res) => {
  return res.status(200).json({ ok: true, service: "myclarix-backend", ts: Date.now() });
});
app.get("/api/health", (req, res) => {
  return res.status(200).json({ ok: true, service: "myclarix-api", ts: Date.now() });
});

// ✅ Webhook router (no vuelve a parsear RAW porque ya lo hicimos arriba en la ruta POST)
app.use("/api", whatsappRouter);

// ✅ Rutas principales
app.use("/api", chatRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor Lumina escuchando en el puerto ${PORT}`);
});
