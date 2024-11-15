const Fare = require('../models/Fare');

// Check Fare Details
exports.checkFare = async (req, res) => {
    try {
        // Add logic to check fare details from the database
        const fareData = await Fare.findOne(); // Example: fetching a single fare entry
        res.json({ message: "Fare details fetched successfully", fareData });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch fare details" });
    }
};

// Calculate Fare based on origin and destination
exports.calculateFare = async (req, res) => {
    const { origin, destination } = req.body;
    try {
        // Fetch base rate per km from DB (assuming single rate for simplicity)
        const fareData = await Fare.findOne();
        const ratePerKm = fareData.ratePerKm;
        
        // Use calculateDistance to determine the distance between origin and destination
        const distance = calculateDistance(origin, destination);
        const fare = distance * ratePerKm;

        res.json({ origin, destination, distance, fare });
    } catch (error) {
        res.status(400).json({ error: "Failed to calculate fare" });
    }
};

// Helper function to calculate distance (simplified example)
function calculateDistance(origin, destination) {
    // Placeholder logic; replace with a proper distance calculation
    return Math.random() * 10; // Random distance between 0-10 km
}
