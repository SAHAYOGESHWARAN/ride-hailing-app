
const express = require('express');
const { requestTrip, acceptTrip, previousTrips } = require('../controllers/tripController');
const authenticateToken = require('../middleware/authenticateToken');
const auth = require('../middleware/auth');  // If you need both authentication types (auth & authenticateToken)

const router = express.Router();

// Request Trip (Rider) - Protected by auth middleware (may be token or another method)
router.post('/request', auth, requestTrip);

// Accept Trip (Driver) - Protected by authenticateToken middleware (checks valid token)
router.post('/accept', authenticateToken, acceptTrip);

// Previous Trips (Rider/Driver) - Protected by auth middleware (could be a different auth method)
router.get('/history/:userId', auth, previousTrips);

module.exports = router;
