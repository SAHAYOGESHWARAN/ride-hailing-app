const express = require('express');
const router = express.Router();
const { requestTrip, acceptTrip, previousTrips } = require('../controllers/tripController');

router.post('/request', requestTrip);
router.post('/accept', acceptTrip);
router.get('/history/:userId', previousTrips);

module.exports = router;
