const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Trip = require('../models/Trip');

// Utility function for error handling
const handleErrorResponse = (res, error, message, statusCode = 500) => {
    console.error(message, error);
    res.status(statusCode).json({ error: message, details: error.message });
};

// Utility function for token generation
const generateToken = (user) => {
    return jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Register User
exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role
        });

        await user.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        handleErrorResponse(res, error, 'Registration failed');
    }
};

// Login User
exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Log to check if email and password are received correctly
    console.log('Email:', email);
    console.log('Password:', password);

    try {
        // Check if email and password are provided in the request
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check if user exists in the database
        const user = await User.findOne({ email });
        console.log(user)
        
        if (!user) {

            return res.status(400).json({ error: 'Invalid credentials' });
        }
          
        // Compare the provided password with the hashed password stored in DB
        const hashedPassword = await bcrypt.hash(password, 10);
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(hashedPassword,"=====", user.password, "====",isMatch)

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return success response with token
        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
};

// Toggle Driver Online/Offline Status
exports.toggleDriverStatus = async (req, res) => {
    const { driverId } = req.body;

    if (!driverId) {
        return res.status(400).json({ error: 'Driver ID is required' });
    }

    try {
        const driver = await User.findById(driverId);

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        if (driver.role !== 'driver') {
            return res.status(403).json({ error: 'Only drivers can toggle status' });
        }
        const updatedDriver = await User.findByIdAndUpdate(
            driverId,
            { isOnline: !driver.isOnline },
            { new: true }
        );

        res.json({
            message: `Driver is now ${updatedDriver.isOnline ? 'online' : 'offline'}`,
            status: updatedDriver.isOnline
        });
    } catch (error) {
        handleErrorResponse(res, error, 'Failed to toggle driver status');
    }
};

// Accept Trip
exports.acceptTrip = async (req, res) => {
    const { tripId } = req.body;

    if (!tripId) {
        return res.status(400).json({ error: 'Trip ID is required' });
    }

    try {
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        const driver = await User.findById(req.user.userId); 
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        if (driver.role !== 'driver') {
            return res.status(403).json({ error: 'Only drivers can accept trips' });
        }

        if (!driver.isOnline) {
            return res.status(400).json({ error: 'Driver is offline and cannot accept trips' });
        }

        // Update trip and driver details
        trip.status = 'accepted';
        trip.driverId = driver._id;
        await trip.save();

        driver.isOnline = false; 
        await driver.save();

        res.json({
            message: 'Trip accepted successfully',
            trip
        });
    } catch (error) {
        handleErrorResponse(res, error, 'Failed to accept trip');
    }
};
