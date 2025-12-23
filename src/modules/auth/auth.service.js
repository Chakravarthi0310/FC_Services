const httpStatus = require('http-status');
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
    if (!user || !(await user.isPasswordMatch(password))) {
        throw new ApiError(401, 'Incorrect email or password');
    }

    if (user.status === status.BLOCKED) {
        throw new ApiError(403, 'Your account has been blocked');
    }

    return user;
};

module.exports = {
    createUser,
    loginUserWithEmailAndPassword,
};
