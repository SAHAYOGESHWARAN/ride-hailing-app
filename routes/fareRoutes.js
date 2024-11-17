const express = require('express');
const router = express.Router();
const fareController = require('../controllers/fareController');

// Check Fare Details
router.get('/check-fare', fareController.checkFare);

// Calculate Fare based on origin and destination
router.post('/calculate-fare', fareController.calculateFare);

module.exports = router;
