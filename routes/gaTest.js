// routes/gaTest.js
const express = require("express");
const router = express.Router();
const { sendGAEvent } = require("../utils/ga4");

router.get("/ga-test", async (req, res) => {
  await sendGAEvent(
    { body: { clientId: "debug_test_client" } },
    "ga_test_event",
    { source: "manual_test" }
  );

  res.json({ ok: true, msg: "Evento GA4 enviado (si GA4_DEBUG=true, debería verse en DebugView)" });
});

module.exports = router;

