require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

const { clientContext } = require("./clientContext.js");
const chatRoutes = require("./routes/chatRoutes.js");

const app = express();

// ----------------------
// 🟣 HABILITAR CORS
// ----------------------
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "x-client-id", "x-company-id"],
}));

app.use(express.json());
app.use(clientContext);

app.use(express.static(path.join(__dirname, "public")));

app.use("/api", chatRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor Lumina escuchando en el puerto ${PORT}`);
});
