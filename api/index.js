const app = require('../src/app');
const connectDB = require('../src/config/db');
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    // Ensure DB is connected
    if (mongoose.connection.readyState === 0) {
        await connectDB();
    }

    // Forward request to Express app
    app(req, res);
};
