const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
    try {
        // Extract the token from the "Authorization" header
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided or invalid format.' });
        }

        const token = authHeader.replace('Bearer ', '').trim();

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Optional: Check if the user exists in the database
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found. Token invalid or user does not exist.' });
        }

        // Optional: Check if the user's account is active
        if (!user.isActive) {
            return res.status(403).json({ error: 'User account is inactive. Please contact support.' });
        }

        // Attach user details to the request for downstream use
        req.user = {
            id: user._id,
            email: user.email,
            role: user.role,
        };

        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired. Please log in again.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ error: 'Invalid token. Authentication failed.' });
        }

        console.error('Authentication middleware error:', error.message);
        res.status(500).json({ error: 'Internal server error during authentication.' });
    }
};

module.exports = authenticateToken;
