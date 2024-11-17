const Fare = require('../models/Fare');
const axios = require('axios'); 
const { calculateDistance } = require('../utils/distanceUtils');


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

// Calculate Fare based on origin and destinationexports.calculateFare = async (req, res) => {
    exports.calculateFare = async (req, res) => {
        const { origin, destination } = req.body;
    
        // Validate that origin and destination are provided
        if (!origin || !destination) {
            return res.status(400).json({ error: 'Origin and destination are required' });
        }
    
        // Validate that the origin and destination coordinates are valid arrays with [lat, lon]
        if (!Array.isArray(origin) || origin.length !== 2 || !Array.isArray(destination) || destination.length !== 2) {
            return res.status(400).json({ error: 'Origin and destination must be arrays of [lat, lon]' });
        }
    
        try {
            // Calculate the distance between origin and destination
            const distance = calculateDistance(origin[0], origin[1], destination[0], destination[1]);
    
            // Initialize fare variable
            let fare;
    
            // Calculate fare based on distance
            if (distance >= 1 && distance <= 5) {
                fare = 100;
            } else if (distance > 5 && distance <= 10) {
                fare = 200;
            } else if (distance > 10 && distance <= 20) {
                fare = 300;
            } else if (distance > 20 && distance <= 30) {
                fare = 400;
            } else {
                fare = 1000;
            }
    
            res.json({
                message: 'Fare calculated successfully',
                fare,
                distance
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
