// ==============================================
// routes/savedEventRoutes.js
// Purpose: Define saved event plans API routes.
//
// Endpoints:
//   GET    /api/saved-events      → getAllSavedEvents  (protected)
//   GET    /api/saved-events/:id  → getSavedEventById  (protected)
//   POST   /api/saved-events      → saveEvent          (protected)
//   DELETE /api/saved-events/:id  → deleteSavedEvent   (protected)
//   PUT    /api/saved-events/:id  → updateSavedEvent   (protected)
//
// Mounted in server.js at: /api/saved-events
// ==============================================

const express = require("express");
const router  = express.Router();

const {
    getAllSavedEvents,
    getSavedEventById,
    saveEvent,
    deleteSavedEvent,
    updateSavedEvent
} = require("../controllers/savedEventController");

const authMiddleware = require("../middleware/authMiddleware");

// ----------------------------------------------
// PROTECTED ROUTES
// Valid JWT token required on all saved-event routes
// authMiddleware runs before every controller
// ----------------------------------------------

// Get all saved event plans for logged-in user
// GET /api/saved-events
router.get("/", authMiddleware, getAllSavedEvents);

// Get a single saved event plan by ID
// GET /api/saved-events/:id
router.get("/:id", authMiddleware, getSavedEventById);

// Save a new AI-generated event plan
// POST /api/saved-events
router.post("/", authMiddleware, saveEvent);

// Delete a saved event plan by ID
// DELETE /api/saved-events/:id
router.delete("/:id", authMiddleware, deleteSavedEvent);

// Update special requirements for a saved event plan by ID
// PUT /api/saved-events/:id
router.put("/:id", authMiddleware, updateSavedEvent);

// ==============================================
// EXPORT ROUTER
// ==============================================

module.exports = router;