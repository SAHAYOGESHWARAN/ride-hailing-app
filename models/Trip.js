const mongoose = require("mongoose");

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, default: "driver" },
  driverLat: { type: Number, default: null },
  driverLong: { type: Number, default: null },
});

// Use existing model if already created, or create a new one
const User = mongoose.models.User || mongoose.model("User", userSchema);

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
      enum: ["requested", "in-progress", "completed", "cancelled"],
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

module.exports = { User, Trip };
