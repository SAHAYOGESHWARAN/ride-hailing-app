const Trip = require('../models/Trip');
const User = require('../models/User');

// Request Trip (Rider)
exports.requestTrip = async (req, res) => {
    const { origin, destination, fare } = req.body;
    const riderId = req.user.id; // Assuming the user is authenticated and the ID is attached to the request by middleware

    try {
        // Validate required fields
        if (!origin || !destination) {
            return res.status(400).json({ error: 'Origin and destination are required' });
        }

        // Calculate fare if not provided
        if (!fare) {
            return res.status(400).json({ error: 'Fare details are required' });
        }

        // Create a new trip
        const newTrip = new Trip({
            rider: riderId,
            origin,
            destination,
            fare,
            status: 'requested',  // Trip is in requested status initially
        });

        await newTrip.save();

        res.status(201).json({
            message: 'Trip requested successfully',
            trip: newTrip,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to request trip' });
    }
};

// Accept Trip (Driver)
exports.acceptTrip = async (req, res) => {
    const { driverId, tripId } = req.body;

    try {
        // Find driver and ensure they are online
        const driver = await User.findById(driverId);
        if (!driver || !driver.isOnline) {
            return res.status(400).json({ error: 'Driver not available or offline' });
        }

        // Find and update the trip to accepted status and assign the driver
        const trip = await Trip.findByIdAndUpdate(
            tripId,
            { driver: driverId, status: 'accepted' },
            { new: true } // Return the updated trip
        );

        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        res.json({
            message: 'Trip accepted successfully',
            trip,
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Failed to accept trip' });
    }
};

// Previous Trips (Rider/Driver)
exports.previousTrips = async (req, res) => {
    const { userId } = req.params;

    try {
        // Find trips for the user (either as rider or driver)
        const trips = await Trip.find({ $or: [{ rider: userId }, { driver: userId }] });

        if (trips.length === 0) {
            return res.status(404).json({ message: 'No previous trips found' });
        }

        res.json({
            trips,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve trips' });
    }
};
