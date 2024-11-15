const Fare = require('../models/Fare');
const axios = require('axios'); 

// Check Fare Details
exports.checkFare = async (req, res) => {
    try {
        const fareData = await Fare.findOne();

        if (!fareData) {
            return res.status(404).json({ error: 'Fare details not found' });
        }

        res.json({
            message: "Fare details fetched successfully",
            fareData: {
                baseFare: fareData.baseFare,
                ratePerKm: fareData.ratePerKm,
                currency: fareData.currency
            }
        });
    } catch (error) {
        console.error('Error fetching fare details:', error);
        res.status(500).json({ error: 'Failed to fetch fare details', details: error.message });
    }
};

// Calculate Fare based on origin and destination
exports.calculateFare = async (req, res) => {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
        return res.status(400).json({ error: 'Origin and destination are required' });
    }

    try {
        // Fetch base rate and fare data from the database
        const fareData = await Fare.findOne();

        if (!fareData) {
            return res.status(404).json({ error: 'Fare details not configured' });
        }

        const { baseFare, ratePerKm } = fareData;

        // Calculate distance using external API (e.g., Google Maps API)
        const distance = await getDistanceFromCoordinates(origin, destination);

        if (distance < 0) {
            return res.status(400).json({ error: 'Unable to calculate distance' });
        }

        // Calculate fare
        const fare = baseFare + (distance * ratePerKm);

        res.json({
            origin,
            destination,
            distance: `${distance.toFixed(2)} km`,
            fare: `${fare.toFixed(2)} ${fareData.currency || 'USD'}`
        });
    } catch (error) {
        console.error('Error calculating fare:', error);
        res.status(500).json({ error: 'Failed to calculate fare', details: error.message });
    }
};

// Helper function to calculate distance between coordinates using an API
async function getDistanceFromCoordinates(origin, destination) {
    try {
        // Replace with your actual distance API key and endpoint (e.g., Google Maps API or OpenStreetMap)
        const apiKey = process.env.MAPS_API_KEY; // Store API key in an environment variable
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
            origin
        )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

        const response = await axios.get(url);

        if (
            response.data &&
            response.data.rows &&
            response.data.rows[0] &&
            response.data.rows[0].elements &&
            response.data.rows[0].elements[0].distance
        ) {
            // Distance in kilometers
            const distanceInMeters = response.data.rows[0].elements[0].distance.value;
            return distanceInMeters / 1000; // Convert meters to kilometers
        }

        throw new Error('Invalid response from distance API');
    } catch (error) {
        console.error('Error calculating distance:', error.message);
        return -1; // Return -1 if distance calculation fails
    }
}
