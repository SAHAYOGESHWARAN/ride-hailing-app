const express = require('express');
const router = express.Router();
const { checkFare, calculateFare } = require('../controllers/fareController');
const { body, validationResult } = require('express-validator'); 

// Route to check fare details
router.get('/check-fare', async (req, res, next) => {
    try {
        await checkFare(req, res);
    } catch (err) {
        next(err); 
    }
});

// Route to calculate fare based on origin and destination
// router.post(
//     '/calculate',
//     fareLimiter, 
//     [
//         // Input validation for calculateFare
//         body('origin', 'Origin is required and must be a string').notEmpty().isString(),
//         body('destination', 'Destination is required and must be a string').notEmpty().isString(),
//     ],
//     async (req, res, next) => {
//         // Check for validation errors
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({ errors: errors.array() });
//         }
//         try {
//             await calculateFare(req, res);
//         } catch (err) {
//             next(err); 
//         }
//     }
// );

module.exports = router;
