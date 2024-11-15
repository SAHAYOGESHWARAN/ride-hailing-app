const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const tripController = require('../controllers/tripController');
const { register, login, toggleDriverStatus } = require('../controllers/authController');

// Register Route
router.post('/register', register);

// Login Route
router.post('/login', login);

// Toggle Driver Online/Offline Status Route (auth is sufficient here if it validates token)
router.post('/driver-status', auth, toggleDriverStatus); 

// Accept Trip Route, Protected with auth middleware (already validates token)
router.post('/accept', auth, tripController.acceptTrip);  // Single middleware for token validation and authorization

module.exports = router;
