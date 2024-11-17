const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    origin: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
    },
    destination: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
    },
    distance: { type: Number, required: true },
    fare: { type: Number, required: true },
    status: { type: String, enum: ['requested', 'in-progress', 'completed', 'cancelled'], default: 'requested' },
    requestedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Trip', tripSchema);
