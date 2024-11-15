
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        // Attach the user object to the request
        req.user = user;

        // Continue to the next middleware or route handler
        next();
    });
};

module.exports = authenticateToken;
