const express = require("express");
const { chatController } = require("../controllers/chatController.js");

const router = express.Router();

router.post("/chat", chatController);

module.exports = router;
