-- ==============================================
-- AI Event Planner — Database Schema
-- Database: SQLite
-- File: schema.sql
-- ==============================================
-- This file is automatically executed by config/db.js
-- on server startup using CREATE TABLE IF NOT EXISTS
-- so it is safe to run multiple times.
-- ==============================================


-- ----------------------------------------------
-- TABLE 1: users
-- Purpose: Store user account information
-- ----------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,               -- Stores bcrypt hashed password
    created_at  DATETIME DEFAULT (datetime('now'))
);


-- ----------------------------------------------
-- TABLE 2: venues
-- Purpose: Store available event venues
-- ----------------------------------------------

CREATE TABLE IF NOT EXISTS venues (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_name  TEXT    NOT NULL,
    city        TEXT    NOT NULL,
    event_type  TEXT    NOT NULL,               -- e.g. Wedding, Birthday, Corporate
    capacity    INTEGER NOT NULL,               -- Maximum number of guests
    cost        INTEGER NOT NULL                -- Venue booking cost in rupees
);


-- ----------------------------------------------
-- TABLE 3: caterers
-- Purpose: Store catering service information
-- ----------------------------------------------

CREATE TABLE IF NOT EXISTS caterers (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    caterer_name      TEXT    NOT NULL,
    city              TEXT    NOT NULL,
    cuisine_type      TEXT    NOT NULL,         -- e.g. Gujarati, Chinese, Continental
    price_per_person  INTEGER NOT NULL          -- Per head catering cost in rupees
);


-- ----------------------------------------------
-- TABLE 4: saved_events
-- Purpose: Store AI-generated event plans saved by users
-- ----------------------------------------------

CREATE TABLE IF NOT EXISTS saved_events (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id               INTEGER NOT NULL,
    event_type            TEXT    NOT NULL,
    city                  TEXT    NOT NULL,
    budget                INTEGER NOT NULL,
    guest_count           INTEGER NOT NULL,
    event_date            TEXT    NOT NULL,
    special_requirements  TEXT,                 -- Optional field
    recommended_venue     TEXT,                 -- Venue name saved as text snapshot
    recommended_caterer   TEXT,                 -- Caterer name saved as text snapshot
    ai_event_plan         TEXT,                 -- Full AI-generated event plan
    ai_risk_analysis      TEXT,                 -- Full AI-generated risk analysis
    ai_invitation         TEXT,                 -- Full AI-generated invitation text
    created_at            DATETIME DEFAULT (datetime('now')),

    -- Foreign key: links saved event to the user who created it
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
