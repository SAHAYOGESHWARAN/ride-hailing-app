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
        res.status(400).json({ error: "Registration failed" });
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

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({
            token,
            userId: user._id,
            role: user.role
        });
    } catch (error) {
        res.status(400).json({ error: "Login failed" });
    }
};

// Toggle Driver Online/Offline Status
exports.toggleDriverStatus = async (req, res) => {
    try {
        // Get the driverId from the body
        const { driverId } = req.body;

        if (!driverId) {
            return res.status(400).json({ error: 'Driver ID is required' });
        }

        // Fetch the driver from the database
        const driver = await User.findById(driverId);

        // Check if driver exists
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        // Ensure the driver is a driver (role check)
        if (driver.role !== 'driver') {
            return res.status(400).json({ error: 'Only drivers can toggle status' });
        }

        // Log the current status
        console.log('Current Status:', driver.isOnline);

        // Toggle the online/offline status
        driver.isOnline = !driver.isOnline;

        // Log the new toggled status
        console.log('Toggled Status:', driver.isOnline);

        // Save the driver with the new status
        await driver.save();

        // Return the updated driver status
        res.json({
            message: `Driver is now ${driver.isOnline ? 'online' : 'offline'}`,
            status: driver.isOnline
        });
    } catch (error) {
        // Log the error for debugging
        console.error('Error toggling driver status:', error);

        // Check for specific error types and provide more detailed responses
        if (error instanceof TypeError) {
            return res.status(500).json({ error: 'Unexpected error occurred while processing the request' });
        } else if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid driver ID format' });
        }

        // Default error response
        res.status(500).json({ error: 'Failed to toggle status' });
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

        console.log('Trip found:', trip);

        // Check if the driver is online (assuming the driver's status is stored in the `isOnline` field)
        const driver = await User.findById(trip.driverId);  // Assuming driverId is stored in trip
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        console.log('Driver found:', driver);

        // Debug the driver status
        console.log('Driver Status:', driver.isOnline);

        // Check if the driver is online
        if (!driver.isOnline) {
            return res.status(400).json({ error: 'Driver not available or offline' });
        }

        // Ensure the driver is eligible to accept the trip (check role)
        if (driver.role !== 'driver') {
            return res.status(400).json({ error: 'Only drivers can accept trips' });
        }

        // Update trip status to "accepted"
        trip.status = 'accepted';
        await trip.save();

        console.log('Trip Status updated to accepted:', trip.status);

        // Respond with the updated trip info
        res.json({ message: 'Trip accepted successfully', trip });
    } catch (error) {
        console.error('Error in accepting trip:', error);
        res.status(500).json({ error: 'Failed to accept trip' });
    }
};