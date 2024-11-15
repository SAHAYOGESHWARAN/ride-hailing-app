
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); 
app.use(cors());          
app.use(morgan('dev'));   

// MongoDB Connection
mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected successfully'))
    .catch((error) => console.error('MongoDB connection error:', error));

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

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
