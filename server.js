const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// Import routes
const tripRoutes = require('./routes/tripRoutes');
const authRoutes = require('./routes/authRoutes');
const fareRoutes = require('./routes/fareRoutes');
const someRouteFile = require('./routes/someRouteFile');

// Initialize the express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Setup
app.use(helmet());  // Security headers
app.use(express.json());  // Parse JSON bodies
app.use(cors({  // Cross-origin resource sharing configuration
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));  // HTTP request logging
app.use(rateLimit({  // Rate limiting to prevent abuse
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,  // limit each IP to 100 requests per window
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
        process.exit(1);  // Exit the process with failure if DB connection fails
    }
};
connectDB();

// Route middlewares
app.use('/api/auth', authRoutes);
app.use('/api/fare', fareRoutes);
app.use('/api/trip', tripRoutes); 
app.use('/api/trips',tripRoutes);
app.use('/api', someRouteFile);

// Serve static files in production (if applicable)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}

// Global error handling middleware
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
