// routes/metricsRoutes.js
const express = require("express");
const router = express.Router();

const { trackGa4 } = require("../controllers/metricsController");

// POST /api/metrics/ga4
router.post("/ga4", trackGa4);

module.exports = router;
