const mongoose = require('mongoose');

const FareSchema = new mongoose.Schema(
    {
        location: {
            type: String,
            required: true,
            trim: true, 
            lowercase: true,
        },
        ratePerKm: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: Number.isFinite,
                message: 'Rate per km must be a valid number',
            },
        },
        baseFare: {
            type: Number,
            default: 0, 
            min: 0,
        },
        peakMultiplier: {
            type: Number,
            default: 1, 
            min: 1,
            validate: {
                validator: Number.isFinite,
                message: 'Peak multiplier must be a valid number',
            },
        },
        isActive: {
            type: Boolean,
            default: true, 
        },
    },
    { timestamps: true } 
);


FareSchema.statics.calculateFare = async function (location, distance) {
    const fareDetails = await this.findOne({ location, isActive: true });
    if (!fareDetails) {
        throw new Error(`Fare details for location "${location}" not found`);
    }

    const { ratePerKm, baseFare, peakMultiplier } = fareDetails;
    const totalFare = (distance * ratePerKm + baseFare) * peakMultiplier;

    return {
        location,
        distance,
        baseFare,
        ratePerKm,
        peakMultiplier,
        totalFare: parseFloat(totalFare.toFixed(2)), // Rounds to 2 decimal places
    };
};

module.exports = mongoose.model('Fare', FareSchema);
