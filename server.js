require("dotenv").config();
const express = require("express");
const path = require("path");

const chatRoutes = require("./routes/chatRoutes.js");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", chatRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor Lumina escuchando en el puerto ${PORT}`);
});
