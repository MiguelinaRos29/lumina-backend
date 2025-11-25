// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const chatRoutes = require('./routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (tu chat.html, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal de API para el chat
app.use('/api/chat', chatRoutes);

// Ruta sencilla para comprobar que el servidor está vivo
app.get('/', (req, res) => {
  res.send('Lumina backend está corriendo ✅');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Lumina escuchando en el puerto ${PORT}`);
});
const appointmentRoutes = require("./routes/appointmentRoutes");
app.use("/api/appointments", appointmentRoutes);
