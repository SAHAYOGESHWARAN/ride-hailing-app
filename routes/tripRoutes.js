const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken'); 
const {
    requestTrip,
    acceptTrip,
    previousTrips
} = require('../controllers/tripController');
const auth = require('../middleware/auth');  

// Request Trip (Rider)
router.post('/request', auth, requestTrip);

// Accept Trip (Driver)
router.post('/accept', authenticateToken, acceptTrip);

// Previous Trips (Rider/Driver)
router.get('/history/:userId', auth, previousTrips);

module.exports = router;
