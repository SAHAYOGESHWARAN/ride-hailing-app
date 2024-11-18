const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const tripController = require('../controllers/tripController');
const { register, login, toggleDriverStatus } = require('../controllers/authController');
const rateLimit = require('express-rate-limit'); 

// Register Route
router.post(
    '/register',
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

module.exports = router;
