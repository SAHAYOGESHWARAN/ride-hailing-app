const express = require("express");
const { body, validationResult } = require("express-validator");
const {
  createTrip,
  requestTrip,
  acceptTrip,
  previousTrips,
  viewTripRequests,
} = require("../controllers/tripController");
const authenticateToken = require("../middleware/authenticateToken");
const auth = require("../middleware/auth");

const router = express.Router();

// Role-based access control (RBAC) middleware
const authorizeRoles = (roles) => {
 
    return (req, res, next) => {
      const userRole = req.user?.role; 

      if (!userRole || !roles.includes(userRole)) {
        return res.status(403).json({ error: "You do not have permission to access this route." });
      }
      next();
    };
  };

// Request Trip (Rider) - Protected by auth middleware
// Input validation and rate limiting
router.post(
  "/request",
  auth, // Ensure the user is authenticated
  [
    // Validate the input data
    body("origin", "Origin is required and must be an object").notEmpty().isObject(),
    body("destination", "Destination is required and must be an object").notEmpty().isObject(),
    body("fare", "Fare must be a valid number").isNumeric().notEmpty(),
  ],
  (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  requestTrip // Controller function to handle trip request
);

// Accept Trip (Driver) - Protected by authenticateToken middleware
// Input validation and role authorization
router.post(
  "/accept",
  authenticateToken, // Ensure the user is authenticated with a token
  [
    body("tripId", "Trip ID is required and must be a valid MongoDB ID").notEmpty().isMongoId(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  authorizeRoles(["driver"]), // Restrict access to drivers only
  acceptTrip // Controller function to handle trip acceptance
);

// View Nearby Trip Requests (Driver)
router.get(
  "/view-trip-requests",
  auth, // Ensure the user is authenticated
  authorizeRoles(["driver"]), // Restrict to drivers
  viewTripRequests // Controller function to retrieve nearby trips
);

// Retrieve Previous Trips (Rider/Driver) - Protected by auth middleware
router.get(
  "/history/:userId",
  auth, // Ensure the user is authenticated
  previousTrips // Controller function to fetch trip history
);

// Create a Trip (General) - Open route for testing or admin use
router.post(
  "/create",
  [
    body("origin", "Origin is required and must be an object").notEmpty().isObject(),
    body("destination", "Destination is required and must be an object").notEmpty().isObject(),
    body("fare", "Fare must be a valid number").isNumeric().notEmpty(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  createTrip // Controller function to create a trip
);

module.exports = router;
