const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const verifyToken = require('../middleware/auth');

const tripController = require('../controllers/tripController');
const { register, login, toggleDriverStatus } = require('../controllers/authController');

// Register Route
router.post('/register', register);

// Login Route
router.post('/login', login);

// Toggle Driver Online/Offline Status Route
router.post('/driver-status', auth, verifyToken,toggleDriverStatus); // Use auth middleware

// Protect the trip accept route with the verifyToken middleware
router.post('/accept', verifyToken, tripController.acceptTrip);
module.exports = router;
