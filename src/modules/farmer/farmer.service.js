const Farmer = require('./farmer.model');
const ApiError = require('../../common/errors/ApiError');

/**
 * Create a farmer profile
 * @param {string} userId
 * @param {Object} profileData
 * @returns {Promise<Farmer>}
 */
const createFarmerProfile = async (userId, profileData) => {
    const existingProfile = await Farmer.findOne({ userId });
    if (existingProfile) {
        throw new ApiError(400, 'Farmer profile already exists for this user');
    }

    return Farmer.create({
        userId,
        ...profileData,
    });
};

/**
 * Update farmer verification status (Admin only)
 * @param {string} userId
 * @param {string} status
 * @returns {Promise<Farmer>}
 */
const updateFarmerVerification = async (userId, status) => {
    const farmer = await Farmer.findOne({ userId });
    if (!farmer) {
        throw new ApiError(404, 'Farmer profile not found');
    }

    farmer.verificationStatus = status;
    await farmer.save();
    return farmer;
};

/**
 * Get farmer profile by user ID
 * @param {string} userId
 * @returns {Promise<Farmer>}
 */
const getFarmerByUserId = async (userId) => {
    return Farmer.findOne({ userId });
};

/**
 * Get all farmers (Admin only)
 * @returns {Promise<Farmer[]>}
 */
const getAllFarmers = async () => {
    return Farmer.find().populate('userId', 'name email').sort({ createdAt: -1 });
};

/**
 * Get pending farmers (Admin only)
 * @returns {Promise<Farmer[]>}
 */
const getPendingFarmers = async () => {
    return Farmer.find({ verificationStatus: 'PENDING' })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });
};

module.exports = {
    createFarmerProfile,
    updateFarmerVerification,
    getFarmerByUserId,
    getAllFarmers,
    getPendingFarmers,
};
