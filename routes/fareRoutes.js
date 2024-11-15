const express = require('express');
const router = express.Router();
const { checkFare, calculateFare } = require('../controllers/fareController');
const { body, validationResult } = require('express-validator'); 
const rateLimit = require('express-rate-limit'); 

// Rate Limiting Middleware for calculating fare
const fareLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit to 5 requests per windowMs
    message: 'Too many fare calculation attempts, please try again later.',
});

// Route to check fare details
router.get('/check', async (req, res, next) => {
    try {
        await checkFare(req, res);
    } catch (err) {
        next(err); // Pass errors to global error handler
    }
});

// Route to calculate fare based on origin and destination
router.post(
    '/calculate',
    fareLimiter, 
    [
        // Input validation for calculateFare
        body('origin', 'Origin is required and must be a string').notEmpty().isString(),
        body('destination', 'Destination is required and must be a string').notEmpty().isString(),
    ],
    async (req, res, next) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            await calculateFare(req, res);
        } catch (err) {
            next(err); 
        }
    }
);

module.exports = router;
