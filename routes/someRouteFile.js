const express = require('express');
const { body, validationResult } = require('express-validator'); 
const rateLimit = require('express-rate-limit'); 
const authenticateToken = require('../middleware/authenticateToken'); 

const router = express.Router();

// Rate limiting middleware to prevent abuse
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit to 5 requests per window
    message: 'Too many requests, please try again later.',
});

// Role-based access control (RBAC) middleware
const authorizeRoles = (roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role; // Extract the role from the authenticated user (set by authenticateToken)

        if (!roles.includes(userRole)) {
            return res.status(403).json({ error: 'You do not have permission to access this route.' });
        }
        next();
    };
};

// Protected Route with rate limiting, validation, and role-based access control
router.post(
    '/someProtectedRoute',
    authenticateToken, // Middleware to authenticate the token
    rateLimiter, // Apply rate limiting
    [
        // Input validation (example: validate the required field)
        body('inputField', 'Input field is required').notEmpty().isString(),
    ],
    authorizeRoles(['admin', 'driver']), // Only allow 'admin' or 'driver' roles to access
    (req, res) => {
        // If all checks pass, proceed with the protected logic
        const { inputField } = req.body;
        res.json({ message: `You have access to this protected route. Your input: ${inputField}` });
    }
);

module.exports = router;
