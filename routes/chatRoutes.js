// routes/chatRoutes.js

const express = require("express");
const { chatcontroller } = require("../controllers/chatcontroller");

const router = express.Router();

// OJO: aquí solo va "/"
router.post("/", chatcontroller);

module.exports = router;
