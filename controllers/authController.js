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
        console.log("Hashed Password During Registration:", hashedPassword);

        const user = new User({
            name,
            email,
            role,
            password : hashedPassword
        });
        console.log("hjkl",user, hashedPassword)
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

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email }).lean();
        console.log(user, email, password)

        if (!user) {
            return res.status(400).json({ error: 'User Not Exist' });
        }

       
        // Compare the plaintext password with the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
       

        if (!isMatch) {
            return res.status(400).json({ error: 'Password Not Matched' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        
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

        driver.isOnline = !driver.isOnline;
        await driver.save();

        res.json({
            message: `Driver is now ${driver.isOnline ? 'online' : 'offline'}`,
            status: driver.isOnline
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
