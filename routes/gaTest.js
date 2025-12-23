const express = require("express");
const router = express.Router();
const { sendGAEvent } = require("../utils/ga4");

router.get("/ga-test", async (req, res) => {
  const result = await sendGAEvent(
    { body: { clientId: "debug_test_client" } },
    "ga_test_event",
    { source: "manual_test" }
  );

  res.json({ ok: true, result });
});

module.exports = router;



