const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');  // Security middleware
const rateLimit = require('express-rate-limit');  // Rate limiting middleware
const path = require('path');  // For serving static files

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Setup
app.use(helmet()); // Secure HTTP headers for better security
app.use(express.json()); // Parse JSON requests
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*', // Dynamic CORS origin, can be set in .env
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Define allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
})); 
app.use(morgan('dev')); // HTTP request logger for development
app.use(rateLimit({ // Apply rate limiting to all routes
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again later.',
}));

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); // Exit the process in case of connection failure
    }
};
connectDB();

// Import routes
const authRoutes = require('./routes/authRoutes');
const fareRoutes = require('./routes/fareRoutes');
const tripRoutes = require('./routes/tripRoutes');
const someRouteFile = require('./routes/someRouteFile');

// Route middlewares
app.use('/api/auth', authRoutes);
app.use('/api/fare', fareRoutes);
app.use('/api/trip', tripRoutes);
app.use('/api', someRouteFile);

// Serve static files in production (if applicable)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}

// Error handling middleware (Global error handler)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Something went wrong!',
        },
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
