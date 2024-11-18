const jwt = require('jsonwebtoken');


const authenticateToken = (req, res, next) => {
    try {
        // Retrieve the token from the Authorization header
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(403).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.replace('Bearer ', '').trim();

        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ error: 'Token expired. Please log in again.' });
                }
                return res.status(401).json({ error: 'Invalid token. Authentication failed.' });
            }

            console.log(decoded)

            // Attach user details from the token to the request object
            req.user = {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role, 
                issuedAt: decoded.iat,
                expiresAt: decoded.exp
            };

            next();
        });
    } catch (error) {
        console.error('Authentication error:', error.message);
        res.status(500).json({ error: 'Internal server error during authentication.' });
    }
};

module.exports = authenticateToken;
