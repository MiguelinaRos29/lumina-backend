const express = require("express");
const router = express.Router();

const {
  chatcontroller,
  getChatHistoryController,
} = require("../controllers/chatcontroller");

// POST /api/chat
router.post("/", chatcontroller);

// GET /api/chat/history?clientId=...
router.get("/history", getChatHistoryController);

module.exports = router;
