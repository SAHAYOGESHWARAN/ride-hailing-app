const User = require('../models/User');  // Assuming you have a User model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register User
exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        // Check if user already exists
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
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Generate a JWT token
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
    const { driverId } = req.body;
    try {
        // Find the driver by ID
        const driver = await User.findById(driverId);

        // Ensure the driver exists and is of role 'driver'
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        if (driver.role !== 'driver') {
            return res.status(400).json({ error: "Only drivers can toggle status" });
        }

        // Toggle the online status
        driver.isOnline = !driver.isOnline;

        // Save the updated driver status to the database
        await driver.save();

        res.json({
            message: `Driver is now ${driver.isOnline ? "online" : "offline"}`,
            driver
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to toggle status" });
    }
};
