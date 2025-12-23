const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const ApiError = require('../errors/ApiError');
const User = require('../../modules/user/user.model');

/**
 * Middleware to authenticate the user using JWT
 */
const authenticate = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            throw new ApiError(401, 'Please authenticate');
        }

        const payload = jwt.verify(token, config.JWT_SECRET);

        // Re-validate user from DB on every request for critical security (status/deletion/role changes)
        const user = await User.findById(payload.userId);

        if (!user) {
            throw new ApiError(401, 'User not found or account deleted');
        }

        if (user.status === 'BLOCKED') {
            throw new ApiError(403, 'Your account has been blocked');
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            next(new ApiError(401, 'Token expired'));
        } else if (error instanceof jwt.JsonWebTokenError) {
            next(new ApiError(401, 'Invalid token'));
        } else {
            next(error);
        }
    }
};

/**
 * Middleware to authorize the user based on roles
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => (req, res, next) => {
    if (!req.user) {
        return next(new ApiError(401, 'Authentication required'));
    }

    if (roles.length && !roles.includes(req.user.role)) {
        return next(new ApiError(403, 'Forbidden'));
    }

    next();
};

module.exports = {
    authenticate,
    authorize,
};
