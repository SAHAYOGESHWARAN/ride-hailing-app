const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register User
exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword, role });
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
        res.json({ token, userId: user._id, role: user.role });
    } catch (error) {
        res.status(400).json({ error: "Login failed" });
    }
};

// Toggle Driver Online/Offline Status
exports.toggleDriverStatus = async (req, res) => {
    const { driverId } = req.body;
    try {
        const driver = await User.findById(driverId);
        if (driver.role !== 'driver') return res.status(400).json({ error: "Only drivers can toggle status" });
        
        driver.isOnline = !driver.isOnline;
        await driver.save();
        res.json({ message: `Driver is now ${driver.isOnline ? "online" : "offline"}`, driver });
    } catch (error) {
        res.status(400).json({ error: "Failed to toggle status" });
    }
};
