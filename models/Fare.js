const mongoose = require('mongoose');

const FareSchema = new mongoose.Schema({
    location: String,
    ratePerKm: Number
});

module.exports = mongoose.model('Fare', FareSchema);
