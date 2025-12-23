const farmerService = require('./farmer.service');

const createProfile = async (req, res, next) => {
    try {
        const profile = await farmerService.createFarmerProfile(req.user._id, req.body);
        res.status(201).json(profile);
    } catch (error) {
        next(error);
    }
};

const verifyFarmer = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        const farmer = await farmerService.updateFarmerVerification(userId, status);
        res.json(farmer);
    } catch (error) {
        next(error);
    }
};

const getMyProfile = async (req, res, next) => {
    try {
        const profile = await farmerService.getFarmerByUserId(req.user._id);
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.json(profile);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createProfile,
    verifyFarmer,
    getMyProfile,
};
