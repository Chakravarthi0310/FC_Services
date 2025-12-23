const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const ApiError = require('./common/errors/ApiError');
const errorHandler = require('./common/middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Routes
app.use('/api', require('./routes'));

// Send back a 404 error for any unknown api request
app.use((req, res, next) => {
    next(new ApiError(404, 'Not found'));
});

// Handle errors
app.use(errorHandler);

module.exports = app;
