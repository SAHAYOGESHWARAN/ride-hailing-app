const express = require('express');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

router.post('/someProtectedRoute', authenticateToken, (req, res) => {
    // Protected logic for the route
    res.json({ message: 'You have access to this protected route.' });
});

module.exports = router;
