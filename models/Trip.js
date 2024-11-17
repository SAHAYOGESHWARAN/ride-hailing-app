const mongoose = require('mongoose');

// Define the Trip schema
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
            default: null,
        },
        origin: {
            lat: { type: Number, required: true },
            lon: { type: Number, required: true },
        },
        destination: {
            lat: { type: Number, required: true },
            lon: { type: Number, required: true },
        },
        originCoordinates: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true }, 
        },
        destinationCoordinates: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true }, 
        },
        distance: {
            type: Number,
            required: true,
            min: 0, 
        },
        fare: {
            type: Number,
            required: true,
            min: 0, 
        },
        status: {
            type: String,
            enum: ['requested', 'accepted', 'in-progress', 'completed', 'cancelled'],
            default: 'requested',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending',
        },
        requestedAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: {
            type: Date,
            default: null, 
        },
        createdAt: {
            type: Date,
            default: Date.now, 
        },
    },
    { timestamps: true } 
);

// Define 2dsphere indexes for geospatial queries
tripSchema.index({ originCoordinates: '2dsphere' });
tripSchema.index({ destinationCoordinates: '2dsphere' });

// Static method to calculate fare
tripSchema.statics.calculateFare = function (distance, ratePerKm, baseFare = 0) {
    return parseFloat((distance * ratePerKm + baseFare).toFixed(2)); // Round to 2 decimal places
};

// Middleware to validate fields before saving
tripSchema.pre('save', function (next) {
    if (!this.originCoordinates || !this.destinationCoordinates) {
        return next(new Error('Both originCoordinates and destinationCoordinates are required.'));
    }

    if (this.distance <= 0) {
        return next(new Error('Distance must be greater than zero.'));
    }

    next();
});

// Virtual field to calculate trip duration (in minutes)
tripSchema.virtual('tripDuration').get(function () {
    if (this.status === 'completed' && this.completedAt) {
        return Math.round((this.completedAt - this.requestedAt) / 1000 / 60); // Duration in minutes
    }
    return null;
});

// Populate `originCoordinates` and `destinationCoordinates` automatically
tripSchema.pre('validate', function (next) {
    if (this.origin) {
        this.originCoordinates = { type: 'Point', coordinates: [this.origin.lon, this.origin.lat] };
    }
    if (this.destination) {
        this.destinationCoordinates = { type: 'Point', coordinates: [this.destination.lon, this.destination.lat] };
    }
    next();
});

module.exports = mongoose.model('Trip', tripSchema);
