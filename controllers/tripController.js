const Trip = require('../models/Trip');
const User = require('../models/User');

// Utility to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRadians = (degree) => (degree * Math.PI) / 180;
    const R = 6371; // Earth's radius in kilometers

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
};

// Create Trip with automatic distance calculation
exports.createTrip = async (req, res) => {
    const { origin, destination, fare } = req.body;

    if (!origin || !destination || !fare) {
        return res.status(400).json({ error: 'Origin, destination, and fare are required' });
    }

    try {
        // Ensure origin and destination are passed as arrays [lat, lon]
        const distance = calculateDistance(
            origin[0], origin[1],  // origin: [lat, lon]
            destination[0], destination[1]  // destination: [lat, lon]
        );

        const trip = new Trip({
            origin,
            destination,
            fare,
            distance,
            rider: req.user.id,  // Assuming user ID is added to the request via authentication middleware
        });

        await trip.save();

        res.status(201).json({
            message: 'Trip created successfully',
            trip
        });
    } catch (error) {
        console.error('Error creating trip:', error);
        res.status(500).json({ error: 'Failed to create trip', details: error.message });
    }
};

// Request Trip (Rider)
exports.requestTrip = async (req, res) => {
    const { origin, destination, fare } = req.body;
    const riderId = req.user.id; // Assuming user ID is added to the request via authentication middleware

    try {
        // Validate input
        if (!origin || !destination || !fare || fare <= 0) {
            return res.status(400).json({ error: 'Valid origin, destination, and fare are required' });
        }

        // Check if origin and destination have coordinates
        if (!origin.coordinates || !destination.coordinates) {
            return res.status(400).json({ error: 'Both origin and destination must have coordinates' });
        }

        // Calculate distance assuming origin and destination coordinates are arrays of [lat, lon]
        const distance = calculateDistance(
            origin.coordinates[0], origin.coordinates[1], // origin coordinates: [lat, lon]
            destination.coordinates[0], destination.coordinates[1] // destination coordinates: [lat, lon]
        );

        const newTrip = new Trip({
            rider: riderId,
            origin,
            destination,
            distance,
            fare,
            status: 'requested',
            requestedAt: new Date()
        });

        await newTrip.save();

        res.status(201).json({
            message: 'Trip requested successfully',
            trip: newTrip
        });
    } catch (error) {
        console.error('Error requesting trip:', error);
        res.status(500).json({ error: 'Failed to request trip', details: error.message });
    }
};

// Accept Trip (Driver)
exports.acceptTrip = async (req, res) => {
    const { tripId } = req.body;
    const driverId = req.user.id;

    try {
        if (!tripId) {
            return res.status(400).json({ error: 'Trip ID is required' });
        }

        const trip = await Trip.findById(tripId).populate('rider', 'name email');
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        if (trip.status !== 'requested') {
            return res.status(400).json({ error: `Trip is already ${trip.status}` });
        }

        const driver = await User.findById(driverId);
        if (!driver || !driver.isOnline || driver.role !== 'driver') {
            return res.status(403).json({ error: 'Invalid driver or driver is offline' });
        }

        trip.status = 'accepted';
        trip.driver = driverId;
        trip.updatedAt = new Date();
        await trip.save();

        res.json({
            message: 'Trip accepted successfully',
            trip
        });
    } catch (error) {
        console.error('Error accepting trip:', error);
        res.status(500).json({ error: 'Failed to accept trip', details: error.message });
    }
};

// Retrieve Previous Trips (Rider/Driver)
exports.previousTrips = async (req, res) => {
    const { userId } = req.params;

    try {
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const trips = await Trip.find({
            $or: [{ rider: userId }, { driver: userId }]
        })
            .populate('rider', 'name email')
            .populate('driver', 'name email')
            .sort({ updatedAt: -1 });

        if (!trips.length) {
            return res.status(404).json({ message: 'No previous trips found' });
        }

        res.json({
            message: 'Previous trips retrieved successfully',
            trips
        });
    } catch (error) {
        console.error('Error retrieving previous trips:', error);
        res.status(500).json({ error: 'Failed to retrieve trips', details: error.message });
    }
};
