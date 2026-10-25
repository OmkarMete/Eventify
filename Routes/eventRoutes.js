// ==============================================
// routes/eventRoutes.js
// Purpose: Define event planning API routes.
//
// Endpoints:
//   POST /api/events/plan → getEventPlan (protected)
//
// Mounted in server.js at: /api/events
// ==============================================

const express         = require("express");
const router          = express.Router();

const { getEventPlan } = require("../controllers/eventController");
const authMiddleware   = require("../middleware/authMiddleware");

// ----------------------------------------------
// PROTECTED ROUTES
// Valid JWT token required on all event routes
// ----------------------------------------------

// Get matching venues and caterers for an event
// POST /api/events/plan
router.post("/plan", authMiddleware, getEventPlan);

// ==============================================
// EXPORT ROUTER
// ==============================================

module.exports = router;
