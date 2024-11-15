const Trip = require('../models/Trip');
const User = require('../models/User');

// Request Trip (Rider)
exports.requestTrip = async (req, res) => {
    const { origin, destination, fare } = req.body;
    const riderId = req.user.id; // Assuming user ID is added to the request via authentication middleware

    try {
        // Validate input
        if (!origin || !destination) {
            return res.status(400).json({ error: 'Origin and destination are required' });
        }

        // Validate fare
        if (!fare || fare <= 0) {
            return res.status(400).json({ error: 'Valid fare is required' });
        }

        // Create a new trip
        const newTrip = new Trip({
            rider: riderId,
            origin,
            destination,
            fare,
            status: 'requested', // Initial status
            createdAt: new Date()
        });

        await newTrip.save();

        res.status(201).json({
            message: 'Trip requested successfully',
            trip: {
                id: newTrip._id,
                rider: newTrip.rider,
                origin: newTrip.origin,
                destination: newTrip.destination,
                fare: newTrip.fare,
                status: newTrip.status,
                createdAt: newTrip.createdAt
            }
        });
    } catch (error) {
        console.error('Error requesting trip:', error);
        res.status(500).json({ error: 'Failed to request trip', details: error.message });
    }
};

// Accept Trip (Driver)
exports.acceptTrip = async (req, res) => {
    const { tripId } = req.body;
    const driverId = req.user.id; // Get driver ID from the authenticated user

    try {
        // Validate input
        if (!tripId) {
            return res.status(400).json({ error: 'Trip ID is required' });
        }

        // Find the trip
        const trip = await Trip.findById(tripId).populate('rider', 'name email'); // Populate rider details
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        // Ensure the trip is in "requested" status
        if (trip.status !== 'requested') {
            return res.status(400).json({ error: `Trip is already ${trip.status}` });
        }

        // Ensure the driver is valid and online
        const driver = await User.findById(driverId);
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        if (!driver.isOnline) {
            return res.status(400).json({ error: 'Driver is offline' });
        }

        if (driver.role !== 'driver') {
            return res.status(403).json({ error: 'Only drivers can accept trips' });
        }

        // Assign the driver to the trip and update its status
        trip.status = 'accepted';
        trip.driver = driverId; // Link the driver
        trip.updatedAt = new Date(); // Update timestamp
        await trip.save();

        res.json({
            message: 'Trip accepted successfully',
            trip: {
                id: trip._id,
                rider: trip.rider,
                origin: trip.origin,
                destination: trip.destination,
                fare: trip.fare,
                status: trip.status,
                driver: { id: driver._id, name: driver.name, email: driver.email },
                updatedAt: trip.updatedAt
            }
        });
    } catch (error) {
        console.error('Error accepting trip:', error);
        res.status(500).json({ error: 'Failed to accept trip', details: error.message });
    }
};

// Previous Trips (Rider/Driver)
exports.previousTrips = async (req, res) => {
    const { userId } = req.params;

    try {
        // Validate input
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Find trips for the user (either as rider or driver), sorted by the latest
        const trips = await Trip.find({
            $or: [{ rider: userId }, { driver: userId }]
        })
            .populate('rider', 'name email') // Populate rider details
            .populate('driver', 'name email') // Populate driver details
            .sort({ updatedAt: -1 }); // Sort by latest update

        if (!trips || trips.length === 0) {
            return res.status(404).json({ message: 'No previous trips found' });
        }

        res.json({
            message: 'Previous trips retrieved successfully',
            trips: trips.map((trip) => ({
                id: trip._id,
                origin: trip.origin,
                destination: trip.destination,
                fare: trip.fare,
                status: trip.status,
                rider: trip.rider ? { id: trip.rider._id, name: trip.rider.name } : null,
                driver: trip.driver ? { id: trip.driver._id, name: trip.driver.name } : null,
                createdAt: trip.createdAt,
                updatedAt: trip.updatedAt
            }))
        });
    } catch (error) {
        console.error('Error retrieving previous trips:', error);
        res.status(500).json({ error: 'Failed to retrieve trips', details: error.message });
    }
};
