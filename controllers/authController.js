const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Trip = require('../models/Trip');

// Register User
exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password before saving to DB
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role
        });

        // Save user to the database
        await user.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(400).json({ error: "Registration failed", details: error.message });
    }
};

// Login User
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({
            token,
            userId: user._id,
            role: user.role
        });
    } catch (error) {
        res.status(400).json({ error: "Login failed", details: error.message });
    }
};

// Toggle Driver Online/Offline Status
exports.toggleDriverStatus = async (req, res) => {
    try {
        const { driverId } = req.body;

        if (!driverId) {
            return res.status(400).json({ error: 'Driver ID is required' });
        }

        const driver = await User.findById(driverId);

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        if (driver.role !== 'driver') {
            return res.status(400).json({ error: 'Only drivers can toggle status' });
        }

        driver.isOnline = !driver.isOnline;
        await driver.save();

        res.json({
            message: `Driver is now ${driver.isOnline ? 'online' : 'offline'}`,
            status: driver.isOnline
        });
    } catch (error) {
        console.error('Error toggling driver status:', error);
        res.status(500).json({ error: 'Failed to toggle status', details: error.message });
    }
};

// Accept Trip
exports.acceptTrip = async (req, res) => {
    const { tripId } = req.body;

    try {
        // Find the trip by ID
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        const driver = await User.findById(trip.driverId);
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        // Check if the driver is online
        if (!driver.isOnline) {
            return res.status(400).json({ error: 'Driver not available or offline' });
        }

        // Ensure the driver is eligible to accept the trip
        if (driver.role !== 'driver') {
            return res.status(400).json({ error: 'Only drivers can accept trips' });
        }

        // Update trip status to "accepted"
        trip.status = 'accepted';
        await trip.save();

        // Update driver status (Optional: You can choose if you want to keep the driver online)
        driver.isOnline = false; // Set driver offline after accepting a trip
        await driver.save();

        // Respond with the updated trip info
        res.json({
            message: 'Trip accepted successfully',
            trip
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to accept trip', details: error.message });
    }
};
