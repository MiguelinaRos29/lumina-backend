// routes/chatRoutes.js
const express = require('express');
const { chatcontroller, getHistory } = require('../controllers/chatcontroller');

const router = express.Router();

// POST /api/chat  → hablar con Lumina
router.post('/', chatcontroller);

// GET /api/chat/history?clientId=xxx  → traer historial
router.get('/history', getHistory);

module.exports = router;

