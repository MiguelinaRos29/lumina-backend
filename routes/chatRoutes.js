const express = require("express");
const { chatcontroller } = require("../controllers/chatcontroller.js");

const router = express.Router();

router.post("/chat", chatcontroller);

module.exports = router;
