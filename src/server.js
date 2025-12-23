const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./common/utils/logger');

const startServer = async () => {
    try {
        // Connect to Database
        await connectDB();

        // Start Express Server
        const server = app.listen(config.PORT, () => {
            logger.info(`🚀 Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err) => {
            logger.error('Unhandled Rejection! Shutting down...', err);
            server.close(() => {
                process.exit(1);
            });
        });

        // Handle SIGTERM for graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('SIGTERM received. Shutting down gracefully...');
            server.close(() => {
                logger.info('Process terminated');
            });
        });

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
