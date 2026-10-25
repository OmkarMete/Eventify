// ==============================================
// middleware/authMiddleware.js
// Purpose: Verify JWT token on protected routes.
// Usage:   Add as middleware to any private route.
//          const auth = require("../middleware/authMiddleware");
//          router.get("/protected", auth, controller);
// ==============================================

const jwt = require("jsonwebtoken");

// ==============================================
// AUTH MIDDLEWARE
// Reads token from Authorization header,
// verifies it, and attaches user info to req.user
// so downstream controllers can access it.
// ==============================================

const authMiddleware = (req, res, next) => {

    // ------------------------------------------
    // STEP 1: Read Authorization header
    // Expected format: "Bearer <token>"
    // ------------------------------------------

    const authHeader = req.headers["authorization"];

    // Check if Authorization header exists
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No authorization header provided."
        });
    }

    // Split "Bearer <token>" and extract the token part
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({
            success: false,
            message: "Access denied. Invalid authorization format. Use: Bearer <token>"
        });
    }

    const token = parts[1];

    // Check if token string is present after "Bearer"
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access denied. Token is missing."
        });
    }

    // ------------------------------------------
    // STEP 2: Verify token using JWT_SECRET
    // jwt.verify() throws an error if:
    // - Token is invalid or tampered
    // - Token has expired
    // - Secret does not match
    // ------------------------------------------

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ------------------------------------------
        // STEP 3: Attach decoded user data to req.user
        // Decoded payload contains: { id, name, email }
        // Controllers can now access req.user.id etc.
        // ------------------------------------------

        req.user = {
            id:    decoded.id,
            name:  decoded.name,
            email: decoded.email
        };

        // Proceed to the next middleware or controller
        next();

    } catch (error) {

        // Handle token expired error specifically
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please log in again."
            });
        }

        // Handle all other invalid token errors
        // (malformed, wrong signature, etc.)
        return res.status(401).json({
            success: false,
            message: "Invalid token. Please log in again."
        });
    }
};

module.exports = authMiddleware;
