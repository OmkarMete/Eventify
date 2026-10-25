// ==============================================
// routes/authRoutes.js
// Purpose: Define authentication API routes.
//
// Endpoints:
//   POST /api/auth/register  → register
//   POST /api/auth/login     → login
//   GET  /api/auth/me        → getMe (protected)
//
// Mounted in server.js at: /api/auth
// ==============================================

const express        = require("express");
const router         = express.Router();

const { register, login, getMe } = require("../controllers/authController");
const authMiddleware              = require("../middleware/authMiddleware");

// ----------------------------------------------
// PUBLIC ROUTES
// No token required
// ----------------------------------------------

// Register a new user account
// POST /api/auth/register
router.post("/register", register);

// Login and receive a JWT token
// POST /api/auth/login
router.post("/login", login);

// ----------------------------------------------
// PROTECTED ROUTES
// Valid JWT token required
// authMiddleware verifies token before handler
// ----------------------------------------------

// Get the currently logged-in user's profile
// GET /api/auth/me
router.get("/me", authMiddleware, getMe);

// ==============================================
// EXPORT ROUTER
// ==============================================

module.exports = router;
