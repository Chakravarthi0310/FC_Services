const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const config = require('../../config/env');
const ApiError = require('../errors/ApiError');
const User = require('../../modules/user/user.model');

const auth = (...requiredRoles) => async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
        }

        const payload = jwt.verify(token, config.JWT_SECRET);
        const user = await User.findById(payload.userId);

        if (!user) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
        }

        if (requiredRoles.length && !requiredRoles.includes(user.role)) {
            throw new ApiError(403, 'Forbidden');
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new ApiError(401, 'Invalid token'));
        } else {
            next(error);
        }
    }
};

module.exports = auth;
