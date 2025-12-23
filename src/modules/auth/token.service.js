const jwt = require('jsonwebtoken');
const config = require('../../config/env');

/**
 * Generate JWT token
 * @param {ObjectId} userId
 * @param {string} role
 * @returns {string}
 */
const generateToken = (userId, role) => {
    const payload = {
        userId,
        role,
    };
    return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });
};

module.exports = {
    generateToken,
};
