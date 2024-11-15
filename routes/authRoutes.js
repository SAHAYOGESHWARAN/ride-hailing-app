const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const { register, login, toggleDriverStatus } = require('../controllers/authController');

// Register Route
router.post('/register', register);

// Login Route
router.post('/login', login);

// Toggle Driver Online/Offline Status Route
router.post('/driver-status', auth, toggleDriverStatus); // Use auth middleware

module.exports = router;
