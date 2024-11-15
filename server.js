const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
connectDB();
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/trip', require('./routes/tripRoutes'));
app.use('/api/fare', require('./routes/fareRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
