const mongoose = require('mongoose');
const Fare = require('./models/Fare');
require('dotenv').config();
const connectDB = require('./config/db');

const initSampleData = async () => {
    await connectDB();

    const fare = new Fare({ location: "City Center", ratePerKm: 5 });
    await fare.save();
    console.log("Sample fare data added.");

    mongoose.connection.close();
};

initSampleData().catch(console.error);
