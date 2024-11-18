const mongoose = require("mongoose");
// Trip Schema
const tripSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
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
    distance: {
      type: Number,
      required: true,
    },
    fare: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["requested", "accepted", "completed", "cancelled"],
      default: "requested",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Use existing model if already created, or create a new one
const Trip = mongoose.models.Trip || mongoose.model("Trip", tripSchema);

module.exports = Trip
