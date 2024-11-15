const Fare = require('../models/Fare');

exports.calculateFare = async (req, res) => {
    const { origin, destination } = req.body;
    try {
        // Fetch base rate per km from DB (assuming single rate for simplicity)
        const fareData = await Fare.findOne(); 
        const ratePerKm = fareData.ratePerKm;
        
        // Assume a function `calculateDistance()` to determine distance between points
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
