const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ['rider', 'driver'] },
    isOnline: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', UserSchema);
