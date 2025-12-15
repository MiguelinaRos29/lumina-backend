const express = require("express");
const router = express.Router();

// ✅ IMPORTA EL CONTROLLER CON EL MISMO NOMBRE EXACTO DEL ARCHIVO
// Si tu archivo se llama: controllers/chatController.js  (C mayúscula)
// entonces debe ser:
const { chatHandler } = require("../controllers/chatController");

// POST /api/chat
router.post("/", chatHandler);

module.exports = router;
