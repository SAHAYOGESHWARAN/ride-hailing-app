const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    fare: { type: Number, required: true },
    status: { type: String, enum: ['requested', 'accepted', 'completed', 'cancelled'], default: 'requested' },
});

module.exports = mongoose.model('Trip', tripSchema);
