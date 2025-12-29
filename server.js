require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

const { clientContext } = require("./clientContext.js");
const chatRoutes = require("./routes/chatRoutes.js");

// ✅ NUEVO: whatsapp webhook router + verify
const {
  router: whatsappRouter,
  verifyMetaSignature,
} = require("./routes/whatsappWebhook.js");

const app = express();

// Render / proxies
app.set("trust proxy", 1);

// ----------------------
// 🟣 CORS (usa CORS_ORIGIN si existe, si no permite todo)
// ----------------------
const corsOrigin = process.env.CORS_ORIGIN || "*";

app.use(
  cors({
    origin: corsOrigin === "*" ? "*" : corsOrigin.split(",").map((s) => s.trim()),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-client-id", "x-company-id"],
  })
);

// ✅ WhatsApp webhook necesita raw body -> middleware SOLO para esas rutas
app.use(
  "/api",
  express.json({
    verify: (req, res, buf) => {
      // guardamos rawBody SOLO en /api/webhook/whatsapp
      // (si no, no pasa nada)
      if (req.originalUrl === "/api/webhook/whatsapp") {
        verifyMetaSignature(req, res, buf);
      }
    },
  })
);

app.use(clientContext);

app.use(express.static(path.join(__dirname, "public")));

// ✅ HEALTH CHECKS
app.get("/health", (req, res) => {
  return res.status(200).json({ ok: true, service: "myclarix-backend", ts: Date.now() });
});
app.get("/api/health", (req, res) => {
  return res.status(200).json({ ok: true, service: "myclarix-api", ts: Date.now() });
});

// ✅ WhatsApp webhook (antes o después, da igual, pero dentro de /api)
app.use("/api", whatsappRouter);

// Chat
app.use("/api", chatRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor Lumina escuchando en el puerto ${PORT}`);
});
