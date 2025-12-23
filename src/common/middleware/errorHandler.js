const logger = require('../utils/logger');
const config = require('../../config/env');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;

    if (config.NODE_ENV === 'production' && !err.isOperational) {
        statusCode = 500;
        message = 'Internal Server Error';
    }

    res.locals.errorMessage = err.message;

    const response = {
        code: statusCode || 500,
        message,
        ...(config.NODE_ENV === 'development' && { stack: err.stack }),
    };

    if (config.NODE_ENV === 'development') {
        logger.error(err);
    }

    res.status(response.code).send(response);
};

module.exports = errorHandler;
