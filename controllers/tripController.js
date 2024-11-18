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
  const driverId = req.user.id;

  try {
    const trip = await Trip.findById(tripId).populate("rider", "name email");
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    if (trip.status !== "requested") {
      return res.status(400).json({ error: `Trip is already ${trip.status}` });
    }

    const driver = await User.findById(driverId);
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
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "driver") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const { driverLat, driverLong } = user;
    const t1 = new Date();
    t1.setMinutes(t1.getMinutes() - 10);

    const requestedTrips = await Trip.find({
      requestedAt: { $gte: t1 },
      status: "requested",
    });

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

// View trip requests with validationexports.viewTripRequests = async (req, res) => {
    exports.viewTripRequests = async (req, res) => {
        try {
          // Validate incoming request
          const errors = validationResult(req);
          if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
          }
      
          // Check for user ID in request parameters
          const userId = req.params.id;
          if (!userId) {
            return res.status(400).json({ message: "User ID is required in the parameters." });
          }
      
          // Find the user by ID
          const user = await User.findById(userId);
          if (!user) {
          
            return res.status(404).json({ message: "User not found." });
          }
      
          // Get driver's location
          const { driverLat, driverLong } = user;
          if (!driverLat || !driverLong) {
            console.error("Driver's location data missing:", { driverLat, driverLong });
            return res.status(400).json({ message: "Driver's location data is missing." });
          }
      
          // Fetch trips requested within the last 10 minutes
          const tenMinutesAgo = new Date();
          tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
      
          const requestedTrips = await Trip.find({
            requestedAt: { $gte: tenMinutesAgo },
            status: "requested",
          });
      
          // Filter trips based on proximity
          const result = requestedTrips.filter((trip) => {
            const distanceInKm = calculateDistance(
              driverLat,
              driverLong,
              trip.origin.lat,
              trip.origin.lon
            );
            return distanceInKm <= 10;
          });
      
          // Respond with filtered trips
          res.json(result);
        } catch (error) {
          console.error("Error in viewTripRequests:", error); // Debugging
          res.status(500).json({ error: "Internal Server Error", details: error.message });
        }
      };
  
  // Accept trip with validation
  exports.acceptTrip = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { tripId, driverId } = req.body;
  
      const updatedTrip = await Trip.findByIdAndUpdate(
        tripId,
        { status: "accepted", driverId },
        { new: true }
      );
  
      if (!updatedTrip) {
        return res.status(404).json({ message: "Trip not found." });
      }
  
      res.json(updatedTrip);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };