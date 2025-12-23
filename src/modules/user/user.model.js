const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { roleNames, roles } = require('../../common/constants/roles');
const { statusNames, status } = require('../../common/constants/status');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            trim: true,
            minlength: 8,
            private: true, // used by the toJSON plugin
        },
        role: {
            type: String,
            enum: roleNames,
            default: roles.CUSTOMER,
        },
        status: {
            type: String,
            enum: statusNames,
            default: status.ACTIVE,
        },
        loginAttempts: {
            type: Number,
            required: true,
            default: 0,
        },
        lockUntil: {
            type: Number,
        },
    },
    {
        timestamps: true,
    }
);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
    const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
    return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
    const user = this;
    return bcrypt.compare(password, user.password);
};

userSchema.pre('save', async function () {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
});

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
