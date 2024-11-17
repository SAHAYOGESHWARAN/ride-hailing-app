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
    const riderId = req.user?.id; // Assuming `req.user` contains authenticated user info

    try {
        // Validate required fields
        if (!origin || !origin.lat || !origin.lon) {
            return res.status(400).json({
                errors: [
                    { 
                        type: 'field',
                        value: origin,
                        msg: 'Valid origin (lat and lon) is required',
                        path: 'origin',
                        location: 'body',
                    },
                ],
            });
        }

        if (!destination || !destination.lat || !destination.lon) {
            return res.status(400).json({
                errors: [
                    {
                        type: 'field',
                        value: destination,
                        msg: 'Valid destination (lat and lon) is required',
                        path: 'destination',
                        location: 'body',
                    },
                ],
            });
        }

        if (!fare || fare <= 0) {
            return res.status(400).json({
                errors: [
                    {
                        type: 'field',
                        value: fare,
                        msg: 'A valid fare greater than 0 is required',
                        path: 'fare',
                        location: 'body',
                    },
                ],
            });
        }

        // Calculate distance using coordinates
        const distance = calculateDistance(
            origin.lat,
            origin.lon,
            destination.lat,
            destination.lon
        );

        // Create new trip
        const newTrip = new Trip({
            rider: riderId,
            origin,
            destination,
            originCoordinates: { type: 'Point', coordinates: [origin.lon, origin.lat] },
            destinationCoordinates: { type: 'Point', coordinates: [destination.lon, destination.lat] },
            distance,
            fare,
            status: 'requested',
        });

        // Save to database
        await newTrip.save();

        return res.status(201).json({
            message: 'Trip requested successfully',
            trip: newTrip,
        });
    } catch (error) {
        console.error('Error requesting trip:', error.message);
        return res.status(500).json({ error: 'Failed to request trip', details: error.message });
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
