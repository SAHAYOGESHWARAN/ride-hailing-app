
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isOnline: { type: Boolean, default: false }, // Add this field
    role: { type: String, enum: ['rider', 'driver'], required: true }
   
});

module.exports = mongoose.model('User', userSchema);
