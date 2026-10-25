// ==============================================
// controllers/authController.js
// Purpose: Handle user registration and login.
// - Validates input fields
// - Hashes passwords with bcryptjs
// - Prevents duplicate email registration
// - Issues JWT tokens on successful login
// - Returns consistent JSON responses
// ==============================================

const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const db     = require("../config/db");

// ==============================================
// REGISTER
// POST /api/auth/register
// Creates a new user account.
//
// Request Body:
//   { name, email, password }
//
// Response:
//   201 - Account created successfully
//   400 - Validation error or duplicate email
//   500 - Server error
// ==============================================

const register = (req, res) => {

    try {
        const { name, email, password } = req.body;

        // ------------------------------------------
        // STEP 1: Validate required fields
        // ------------------------------------------

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: name, email, password."
            });
        }

        // Trim whitespace from inputs
        const trimmedName  = name.trim();
        const trimmedEmail = email.trim().toLowerCase();

        // Validate name length
        if (trimmedName.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Name must be at least 2 characters long."
            });
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        // Password minimum length check
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long."
            });
        }

        // ------------------------------------------
        // STEP 2: Check for duplicate email
        // Prevent two accounts with the same email
        // ------------------------------------------

        const existingUser = db.prepare(`
            SELECT id FROM users WHERE email = ?
        `).get(trimmedEmail);

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "An account with this email already exists. Please log in."
            });
        }

        // ------------------------------------------
        // STEP 3: Hash the password
        // bcrypt saltRounds = 10 is the recommended
        // balance of security and performance
        // ------------------------------------------

        const saltRounds    = 10;
        const hashedPassword = bcrypt.hashSync(password, saltRounds);

        // ------------------------------------------
        // STEP 4: Insert new user into database
        // Only the hashed password is stored —
        // the plain text password is never saved
        // ------------------------------------------

        const insertUser = db.prepare(`
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        `);

        const result = insertUser.run(trimmedName, trimmedEmail, hashedPassword);

        // ------------------------------------------
        // STEP 5: Return success response
        // Do not return password in response
        // ------------------------------------------

        return res.status(201).json({
            success: true,
            message: "Account created successfully. Please log in.",
            user: {
                id:    result.lastInsertRowid,
                name:  trimmedName,
                email: trimmedEmail
            }
        });

    } catch (error) {
        console.error("❌ Register Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Registration failed. Please try again."
        });
    }
};


// ==============================================
// LOGIN
// POST /api/auth/login
// Authenticates a user and returns a JWT token.
//
// Request Body:
//   { email, password }
//
// Response:
//   200 - Login successful + JWT token
//   400 - Validation error
//   401 - Invalid credentials
//   500 - Server error
// ==============================================

const login = (req, res) => {

    try {
        const { email, password } = req.body;

        // ------------------------------------------
        // STEP 1: Validate required fields
        // ------------------------------------------

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Both email and password are required."
            });
        }

        const trimmedEmail = email.trim().toLowerCase();

        // ------------------------------------------
        // STEP 2: Find user by email
        // ------------------------------------------

        const user = db.prepare(`
            SELECT id, name, email, password FROM users WHERE email = ?
        `).get(trimmedEmail);

        // Use a generic message to avoid exposing
        // whether the email exists in the system
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // ------------------------------------------
        // STEP 3: Compare plain password against
        // the stored bcrypt hash
        // ------------------------------------------

        const isPasswordValid = bcrypt.compareSync(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // ------------------------------------------
        // STEP 4: Generate JWT token
        // Payload contains user id, name, email.
        // Secret and expiry read from environment.
        // ------------------------------------------

        const payload = {
            id:    user.id,
            name:  user.name,
            email: user.email
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        // ------------------------------------------
        // STEP 5: Return token and user info
        // Do not return the hashed password
        // ------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id:    user.id,
                name:  user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("❌ Login Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Login failed. Please try again."
        });
    }
};


// ==============================================
// GET CURRENT USER
// GET /api/auth/me
// Returns the authenticated user's profile.
// Requires valid JWT token via authMiddleware.
//
// Response:
//   200 - User profile data
//   404 - User not found
//   500 - Server error
// ==============================================

const getMe = (req, res) => {

    try {

        // req.user is attached by authMiddleware
        // after JWT verification
        const userId = req.user.id;

        // Fetch fresh user data from database
        const user = db.prepare(`
            SELECT id, name, email, created_at FROM users WHERE id = ?
        `).get(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error("❌ Get Me Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user profile. Please try again."
        });
    }
};


// ==============================================
// EXPORTS
// ==============================================

module.exports = {
    register,
    login,
    getMe
};
