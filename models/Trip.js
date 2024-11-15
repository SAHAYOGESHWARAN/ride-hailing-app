const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
    {
        rider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null, // Initially no driver assigned
        },
        origin: {
            type: String,
            required: true,
            trim: true, // Removes extra spaces
        },
        destination: {
            type: String,
            required: true,
            trim: true,
        },
        originCoordinates: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true }, // [longitude, latitude]
        },
        destinationCoordinates: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true }, // [longitude, latitude]
        },
        distance: {
            type: Number,
            required: true, // Pre-computed or calculated distance in kilometers
        },
        fare: {
            type: Number,
            required: true,
            min: 0, // Ensures no negative fares
        },
        status: {
            type: String,
            enum: ['requested', 'accepted', 'completed', 'cancelled'],
            default: 'requested',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending', // Tracks payment for the trip
        },
        requestedAt: {
            type: Date,
            default: Date.now, // Timestamp for when the trip was requested
        },
        completedAt: {
            type: Date,
            default: null, // Timestamp for when the trip is completed
        },
    },
    { timestamps: true } // Adds createdAt and updatedAt fields automatically
);


tripSchema.index({ originCoordinates: '2dsphere' });
tripSchema.index({ destinationCoordinates: '2dsphere' });


tripSchema.statics.calculateFare = function (distance, ratePerKm, baseFare = 0) {
    return parseFloat((distance * ratePerKm + baseFare).toFixed(2)); // Round to 2 decimal places
};


tripSchema.pre('save', function (next) {
    if (!this.originCoordinates || !this.destinationCoordinates) {
        return next(new Error('Both originCoordinates and destinationCoordinates are required.'));
    }

    if (this.distance <= 0) {
        return next(new Error('Distance must be greater than zero.'));
    }

    next();
});


tripSchema.virtual('tripDuration').get(function () {
    if (this.status === 'completed' && this.completedAt) {
        return Math.round((this.completedAt - this.requestedAt) / 1000 / 60); // Duration in minutes
    }
    return null;
});

module.exports = mongoose.model('Trip', tripSchema);
