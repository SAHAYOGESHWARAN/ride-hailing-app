const Trip = require('../models/Trip');
const User = require('../models/User');

// Request Trip (Rider)
exports.requestTrip = async (req, res) => {
    const { riderId, origin, destination, fare } = req.body;
    try {
        const trip = new Trip({ rider: riderId, origin, destination, fare });
        await trip.save();
        res.status(201).json({ message: "Trip requested successfully", trip });
    } catch (error) {
        res.status(400).json({ error: "Failed to request trip" });
    }
};

// Accept Trip (Driver)
exports.acceptTrip = async (req, res) => {
    const { driverId, tripId } = req.body;
    try {
        const driver = await User.findById(driverId);
        if (driver && driver.isOnline) {
            const trip = await Trip.findByIdAndUpdate(tripId, { driver: driverId, status: 'accepted' }, { new: true });
            res.json({ message: "Trip accepted", trip });
        } else {
            res.status(400).json({ error: "Driver not available" });
        }
    } catch (error) {
        res.status(400).json({ error: "Failed to accept trip" });
    }
};

// Previous Trips
exports.previousTrips = async (req, res) => {
    const { userId } = req.params;
    try {
        const trips = await Trip.find({ $or: [{ rider: userId }, { driver: userId }] });
        res.json(trips);
    } catch (error) {
        res.status(400).json({ error: "Failed to retrieve trips" });
    }
};
