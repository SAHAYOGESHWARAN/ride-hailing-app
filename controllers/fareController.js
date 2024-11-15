const Fare = require('../models/Fare');

exports.checkFare = async (req, res) => {
    try {
        const fares = await Fare.find();
        res.json(fares);
    } catch (error) {
        res.status(400).json({ error: "Failed to retrieve fare details" });
    }
};
