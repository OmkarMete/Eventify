// ==============================================
// server.js
// Purpose: Main entry point for the
//          AI Event Planner Express server.
// - Loads environment variables
// - Connects to SQLite database
// - Registers middleware
// - Mounts all API routes
// - Starts the HTTP server
// ==============================================

// Load environment variables from .env file
// Must be called before any other imports
// that rely on process.env
require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const path    = require("path");

// ==============================================
// DATABASE
// Importing db.js triggers:
// - SQLite connection
// - PRAGMA foreign_keys = ON
// - Auto-execution of schema.sql
// ==============================================

require("./config/db");

// ==============================================
// ROUTE IMPORTS
// ==============================================

const authRoutes       = require("./routes/authRoutes");
const eventRoutes      = require("./routes/eventRoutes");
const aiRoutes         = require("./routes/aiRoutes");
const savedEventRoutes = require("./routes/savedEventRoutes");

// ==============================================
// INITIALIZE EXPRESS APP
// ==============================================

const app = express();

// ==============================================
// MIDDLEWARE
// ==============================================

// Enable Cross-Origin Resource Sharing
// Allows frontend to communicate with the API
app.use(cors());

// Parse incoming JSON request bodies
// Required for all POST endpoints
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from /public
// Handles HTML, CSS, JS, and assets
app.use(express.static(path.join(__dirname, "public")));

// ==============================================
// API ROUTES
// ==============================================

// Authentication routes (register, login, me)
app.use("/api/auth", authRoutes);

// Event planning routes (venues + caterers)
app.use("/api/events", eventRoutes);

// AI generation routes (plan, risk, invitation)
app.use("/api/ai", aiRoutes);

// Saved event plan routes (CRUD)
app.use("/api/saved-events", savedEventRoutes);

// ==============================================
// HEALTH CHECK ROUTE
// GET /
// Quick endpoint to verify the API is running
// ==============================================

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "AI Event Planner API is running."
    });
});

// ==============================================
// 404 HANDLER
// Catches any requests to undefined API routes
// ==============================================

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});

// ==============================================
// GLOBAL ERROR HANDLER
// Catches any unhandled errors thrown in routes
// or middleware and returns a clean JSON response
// ==============================================

app.use((err, req, res, next) => {
    console.error("❌ Unhandled Server Error:", err.message);
    res.status(500).json({
        success: false,
        message: "An unexpected server error occurred. Please try again."
    });
});

// ==============================================
// START SERVER
// Reads PORT from .env — falls back to 5000
// ==============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("==============================================");
    console.log("  🎉 AI Event Planner Server Started");
    console.log("==============================================");
    console.log(`  🌐 Server   : http://localhost:${PORT}`);
    console.log(`  🏥 Health   : http://localhost:${PORT}/health`);
    console.log(`  📁 API Base : http://localhost:${PORT}/api`);
    console.log("----------------------------------------------");
    console.log(`  📌 Auth     : http://localhost:${PORT}/api/auth`);
    console.log(`  📌 Events   : http://localhost:${PORT}/api/events`);
    console.log(`  📌 AI       : http://localhost:${PORT}/api/ai`);
    console.log(`  📌 Saved    : http://localhost:${PORT}/api/saved-events`);
    console.log("==============================================");
});
