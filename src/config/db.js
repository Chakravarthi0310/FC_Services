const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../common/utils/logger');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.MONGO_URI);

        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            logger.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('✅ MongoDB reconnected');
        });

    } catch (error) {
        logger.error(`❌ MongoDB connection failed: ${error.message}`);
        // Fail fast on initial connection
        process.exit(1);
    }
};

module.exports = connectDB;
