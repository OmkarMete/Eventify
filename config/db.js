// ==============================================
// config/db.js
// Purpose: SQLite database connection setup
// - Connects to event_planner.db
// - Creates database file if it does not exist
// - Enables foreign key enforcement
// - Auto-executes schema.sql on startup
// ==============================================

const Database = require("better-sqlite3");
const path     = require("path");
const fs       = require("fs");

// ----------------------------------------------
// Resolve paths for database file and schema
// ----------------------------------------------

// Path to the SQLite database file
const DB_PATH = path.join(__dirname, "../database/event_planner.db");

// Path to the SQL schema file
const SCHEMA_PATH = path.join(__dirname, "../schema.sql");

// ----------------------------------------------
// Connect to SQLite database
// better-sqlite3 automatically creates the file
// if it does not already exist
// ----------------------------------------------

let db;

try {
    db = new Database(DB_PATH);
    console.log("✅ Connected to SQLite database:", DB_PATH);
} catch (error) {
    console.error("❌ Failed to connect to SQLite database:", error.message);
    process.exit(1); // Stop server if database connection fails
}

// ----------------------------------------------
// Enable foreign key support
// SQLite disables foreign keys by default
// This must be run on every new connection
// ----------------------------------------------

try {
    db.pragma("foreign_keys = ON");
    console.log("✅ Foreign key enforcement enabled");
} catch (error) {
    console.error("❌ Failed to enable foreign keys:", error.message);
    process.exit(1);
}

// ----------------------------------------------
// Auto-execute schema.sql on startup
// Creates tables if they do not already exist
// Safe to run multiple times (IF NOT EXISTS)
// ----------------------------------------------

try {
    // Read the schema.sql file as a string
    const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");

    // Execute all SQL statements in the schema file
    db.exec(schema);

    console.log("✅ Database schema loaded successfully");
} catch (error) {
    console.error("❌ Failed to load database schema:", error.message);
    process.exit(1);
}

// ----------------------------------------------
// Export the database connection
// Import this in any file that needs DB access:
// const db = require("./config/db");
// ----------------------------------------------

module.exports = db;
