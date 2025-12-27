const express = require("express");
const router = express.Router();

const {
  verifyWebhook,
  receiveWebhook,
} = require("../controllers/whatsappController");

// ✅ Meta verifica con GET
router.get("/", verifyWebhook);

// ✅ Meta envía mensajes con POST
router.post("/", receiveWebhook);

module.exports = router;
