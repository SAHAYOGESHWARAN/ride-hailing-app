const express = require('express');
const router = express.Router();
const { checkFare, calculateFare } = require('../controllers/fareController'); 
// Route to check fare details
router.get('/check', checkFare);

// Route to calculate fare based on origin and destination
router.post('/calculate', calculateFare);

module.exports = router;
