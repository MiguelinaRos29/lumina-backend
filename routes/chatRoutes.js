const express = require("express");
const router = express.Router();

const {
  chatcontroller,
  getChatHistoryController,
} = require("../controllers/chatcontroller");

router.post("/", chatcontroller);
router.get("/history", getChatHistoryController);

module.exports = router;
