require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

const { clientContext } = require("./clientContext.js");
const chatRoutes = require("./routes/chatRoutes.js");
const whatsappRoutes = require("./routes/whatsappRoutes.js"); // ✅ NUEVO

const app = express();

// ----------------------
// 🟣 CORS (solo afecta navegador, Meta webhook no usa CORS)
// ----------------------
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "x-client-id", "x-company-id"],
  })
);

// ✅ Para webhooks + app
app.use(express.json());

app.use(clientContext);

app.use(express.static(path.join(__dirname, "public")));

// ✅ Salud (útil para comprobar rápido en Render)
app.get("/health", (req, res) => res.json({ ok: true }));

// ✅ Chat API (como lo tenías)
app.use("/api", chatRoutes);

// ✅ WhatsApp webhook
app.use("/webhook", whatsappRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor Lumina escuchando en el puerto ${PORT}`);
});
