const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { createTrip, requestTrip, acceptTrip, previousTrips } = require('../controllers/tripController');
const authenticateToken = require('../middleware/authenticateToken');
const auth = require('../middleware/auth');

const router = express.Router();

// Rate limiting middleware to prevent abuse (applies to the trip request route)
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each user to 5 requests per window
    message: 'Too many requests, please try again later.',
});

// Role-based access control (RBAC) middleware
const authorizeRoles = (roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role; 

        if (!roles.includes(userRole)) {
            return res.status(403).json({ error: 'You do not have permission to access this route.' });
        }
        next();
    };
};

// Request Trip (Rider) - Protected by auth middleware
// Input validation and rate limiting
router.post(
    '/request',
    auth, // Ensure the user is authenticated
    rateLimiter, // Apply rate limiting
    [
        // Validate the input data
       body('origin', 'Origin is required').notEmpty().isObject(),
       body('destination', 'Destination is required').notEmpty().isObject(),
        body('fare', 'Fare must be a valid number').isNumeric().notEmpty(),
    ],
    (req, res, next) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next(); 
    },
    requestTrip 
);

// Accept Trip (Driver) - Protected by authenticateToken middleware
// Validate the trip ID
router.post(
    '/accept',
    authenticateToken, 
    [
        body('tripId', 'Trip ID is required').notEmpty().isMongoId(),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next(); 
    },
    authorizeRoles(['driver']),
);

// Previous Trips (Rider/Driver) - Protected by auth middleware
router.get('/history/:userId', auth, previousTrips);

// POST route to create a trip
router.post('/create', createTrip);

module.exports = router;
