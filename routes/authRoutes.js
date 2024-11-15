const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const tripController = require('../controllers/tripController');
const { register, login, toggleDriverStatus } = require('../controllers/authController');
const rateLimit = require('express-rate-limit'); 

// Rate Limiting Middleware for registration and login
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit to 5 requests per windowMs
    message: 'Too many registration attempts, please try again later.',
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit to 5 login attempts per windowMs
    message: 'Too many login attempts, please try again later.',
});

// Register Route
router.post(
    '/register',
    registerLimiter, // Apply rate limit to register
    [
        // Input validation for register
        body('name', 'Name is required').notEmpty(),
        body('email', 'Valid email is required').isEmail(),
        body('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
        body('role', 'Role must be either "rider" or "driver"').isIn(['rider', 'driver']),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            await register(req, res);
        } catch (err) {
            next(err); 
        }
    }
);

// Login Route
router.post(
    '/login',
    loginLimiter, 
    [
        // Input validation for login
        body('email', 'Email is required').isEmail(),
        body('password', 'Password is required').notEmpty(),
    ],
    async (req, res, next) => {
       
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            await login(req, res);
        } catch (err) {
            next(err); 
        }
    }
);

// Toggle Driver Online/Offline Status Route
router.post('/driver-status', auth, async (req, res, next) => {
    try {
        await toggleDriverStatus(req, res);
    } catch (err) {
        next(err); 
    }
});

// Accept Trip Route (Protected)
router.post('/accept', auth, async (req, res, next) => {
    try {
        await tripController.acceptTrip(req, res);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
