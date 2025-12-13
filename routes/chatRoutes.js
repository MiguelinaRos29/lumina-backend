// routes/chatRoutes.js
const express = require("express");
const router = express.Router();

// ✅ IMPORT CORRECTO (porque el controller exporta un objeto { chatHandler })
const { chatHandler } = require("../controllers/chatcontroller");

// POST /api/chat
router.post("/chat", chatHandler);

module.exports = router;
