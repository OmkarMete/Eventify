// ==============================================
// routes/aiRoutes.js
// Purpose: Define AI generation API routes.
//
// Endpoints:
//   POST /api/ai/generate-plan       → getEventPlan    (protected)
//   POST /api/ai/risk-analysis       → getRiskAnalysis (protected)
//   POST /api/ai/generate-invitation → getInvitation   (protected)
//
// Mounted in server.js at: /api/ai
// ==============================================

const express = require("express");
const router  = express.Router();

const { getEventPlan, getRiskAnalysis, getInvitation, getBudgetPlan } = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware");

// ----------------------------------------------
// PROTECTED ROUTES
// Valid JWT token required on all AI routes
// authMiddleware runs before every controller
// ----------------------------------------------

// Generate a full AI event plan using Gemini
// POST /api/ai/generate-plan
router.post("/generate-plan", authMiddleware, getEventPlan);

// Generate an AI risk analysis using Gemini
// POST /api/ai/risk-analysis
router.post("/risk-analysis", authMiddleware, getRiskAnalysis);

// Generate a personalized AI invitation using Gemini
// POST /api/ai/generate-invitation
router.post("/generate-invitation", authMiddleware, getInvitation);

// Generate an optimized budget allocation plan using Gemini
// POST /api/ai/budget-optimizer
router.post("/budget-optimizer", authMiddleware, getBudgetPlan);

// ==============================================
// EXPORT ROUTER
// ==============================================

module.exports = router;