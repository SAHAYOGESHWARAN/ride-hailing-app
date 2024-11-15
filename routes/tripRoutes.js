const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requestTrip, acceptTrip, previousTrips } = require('../controllers/tripController');

router.post('/request', auth, requestTrip);            // Rider requests trip
router.post('/accept', auth, acceptTrip);              // Driver accepts trip
router.get('/history/:userId', auth, previousTrips);   // Retrieve trip history

module.exports = router;
