const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
    rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    fare: Number,
    status: { type: String, enum: ['requested', 'accepted', 'completed'], default: 'requested' },
    origin: String,
    destination: String,
    tripDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Trip', TripSchema);
