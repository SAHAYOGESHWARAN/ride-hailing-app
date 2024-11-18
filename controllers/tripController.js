const Trip = require("../models/Trip");
const User = require("../models/User");
const { validationResult } = require("express-validator");


// Utility to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRadians = (degree) => (degree * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Create Trip
exports.createTrip = async (req, res) => {
  const { origin, destination, fare } = req.body;

  if (!origin || !destination || !fare) {
    return res.status(400).json({ error: "Origin, destination, and fare are required" });
  }

  try {
    const distance = calculateDistance(
      origin.lat, origin.lon, 
      destination.lat, destination.lon
    );

    const trip = new Trip({
      origin,
      destination,
      fare,
      distance,
      rider: req.user.id, 
    });

    await trip.save();

    res.status(201).json({
      message: "Trip created successfully",
      trip,
    });
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ error: "Failed to create trip", details: error.message });
  }
};

// Request Trip (Rider)
exports.requestTrip = async (req, res) => {
  const { origin, destination, fare, rider } = req.body;

  try {
    if (!rider || !origin || !origin.lat || !origin.lon || !destination || !destination.lat || !destination.lon || !fare || fare <= 0) {
      

      return res.status(400).json({ error: "Invalid request data." });
    }

    const distance = calculateDistance(
      origin.lat, origin.lon,
      destination.lat, destination.lon
    );

    const newTrip = new Trip({
      rider,
      origin: { lat: origin.lat, lon: origin.lon },
      destination: { lat: destination.lat, lon: destination.lon },
      distance,
      fare,
      status: "requested",
      requestedAt: new Date(),
    });
    
    console.log("jhfjshjkashfdjkshfhksf",newTrip)

    await newTrip.save();

    res.status(201).json({
      message: "Trip requested successfully",
      trip: newTrip,
    });
  } catch (error) {
    console.error("Error requesting trip:", error);
    res.status(500).json({ error: "Failed to request trip", details: error.message });
  }
};

// Accept Trip (Driver)
exports.acceptTrip = async (req, res) => {
  const { tripId } = req.body;
  console.log("vbnmhj",req.user)
  const driverId = req.user.id;

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    if (trip.status !== "requested") {
      return res.status(400).json({ error: `Trip is already ${trip.status}` });
    }

    const driver = await User.findById(driverId);
    console.log("dcfvghnjm",driverId)
    if (!driver || !driver.isOnline || driver.role !== "driver") {
      return res.status(403).json({ error: "Invalid driver or driver is offline" });
    }

    trip.status = "accepted";
    trip.driverId = driverId;
    trip.updatedAt = new Date();
    await trip.save();

    res.json({
      message: "Trip accepted successfully",
      trip,
    });
  } catch (error) {
    console.error("Error accepting trip:", error);
    res.status(500).json({ error: "Failed to accept trip", details: error.message });
  }
};

// View Nearby Trip Requests (Driver)
exports.viewTripRequests = async (req, res) => {
  try {
    console.log(req.user.id)
    const user = await User.findById(req.user.id);
    console.log("++++++++++", user)
    if (!user || user.role !== "driver") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const { driverLat, driverLong } = user;
    const t1 = new Date();
    t1.setMinutes(t1.getMinutes() - 10);
    console.log("time:", t1, driverLat, driverLong)
    const requestedTrips = await Trip.find({
      //requestedAt: { $gte: t1 },
      status: "requested",
    });
    console.log("respose",requestedTrips )
    const nearbyTrips = requestedTrips.filter((trip) => {
      const distance = calculateDistance(driverLat, driverLong, trip.origin.lat, trip.origin.lon);
      return distance <= 10; // Within 10 kilometers
    });

    res.json({ message: "Nearby trip requests retrieved", trips: nearbyTrips });
  } catch (error) {
    console.error("Error retrieving trip requests:", error);
    res.status(500).json({ error: error.message });
  }
};

// Retrieve Previous Trips (Rider/Driver)
exports.previousTrips = async (req, res) => {
  const { userId } = req.params;

  try {
    const trips = await Trip.find({
      $or: [{ rider: userId }, { driverId: userId }],
    })
      .populate("rider", "name email")
      .populate("driverId", "name email")
      .sort({ updatedAt: -1 });

    if (!trips.length) {
      return res.status(404).json({ message: "No previous trips found" });
    }

    res.json({
      message: "Previous trips retrieved successfully",
      trips,
    });
  } catch (error) {
    console.error("Error retrieving previous trips:", error);
    res.status(500).json({ error: "Failed to retrieve trips", details: error.message });
  }
};