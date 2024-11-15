const express = require('express');
const router = express.Router();
const { checkFare } = require('../controllers/fareController');

router.get('/check', checkFare);

module.exports = router;
