const farmerService = require('./farmer.service');

const createProfile = async (req, res, next) => {
    try {
        const profile = await farmerService.createFarmerProfile(req.user._id, req.body);
        res.status(201).json({ success: true, data: profile });
    } catch (error) {
        next(error);
    }
};

const verifyFarmer = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        const farmer = await farmerService.updateFarmerVerification(userId, status);
        res.json({ success: true, data: farmer });
    } catch (error) {
        next(error);
    }
};

const getMyProfile = async (req, res, next) => {
    try {
        const profile = await farmerService.getFarmerByUserId(req.user._id);
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        res.json({ success: true, data: profile });
    } catch (error) {
        next(error);
    }
};

const getAllFarmers = async (req, res, next) => {
    try {
        const farmers = await farmerService.getAllFarmers();
        res.json({ success: true, data: farmers });
    } catch (error) {
        next(error);
    }
};

const getPendingFarmers = async (req, res, next) => {
    try {
        const farmers = await farmerService.getPendingFarmers();
        res.json({ success: true, data: farmers });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createProfile,
    verifyFarmer,
    getMyProfile,
    getAllFarmers,
    getPendingFarmers,
};
