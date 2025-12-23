const User = require('../user/user.model');
const ApiError = require('../../common/errors/ApiError');
const { status } = require('../../common/constants/status');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
    if (await User.isEmailTaken(userBody.email)) {
        throw new ApiError(400, 'Email already taken');
    }
    return User.create(userBody);
};

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
    const user = await User.findOne({ email });

    // Check if account is locked
    if (user && user.lockUntil && user.lockUntil > Date.now()) {
        const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
        throw new ApiError(403, `Account is temporarily locked. Please try again in ${remainingMinutes} minutes.`);
    }

    if (!user || !(await user.isPasswordMatch(password))) {
        if (user) {
            user.loginAttempts += 1;
            if (user.loginAttempts >= 5) {
                user.lockUntil = Date.now() + 1 * 60 * 60 * 1000; // Lock for 1 hour
            }
            await user.save();
        }
        throw new ApiError(401, 'Incorrect email or password');
    }

    if (user.status === status.BLOCKED) {
        throw new ApiError(403, 'Your account has been blocked');
    }

    // Reset login attempts on success
    if (user.loginAttempts > 0) {
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
    }

    return user;
};

module.exports = {
    createUser,
    loginUserWithEmailAndPassword,
};
