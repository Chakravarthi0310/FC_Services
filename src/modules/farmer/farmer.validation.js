const { z } = require('zod');
const { farmerVerificationStatusNames } = require('../../common/constants/farmer');

const createProfile = {
    body: z.object({
        farmName: z.string().min(2).max(100),
        phone: z.string().min(10).max(15),
        address: z.string().min(5).max(255),
    }),
};

const verifyFarmer = {
    params: z.object({
        userId: z.string().regex(/^[0-9a-fA-F]{24}$/), // Valid MongoDB ObjectId
    }),
    body: z.object({
        status: z.enum(farmerVerificationStatusNames),
    }),
};

module.exports = {
    createProfile,
    verifyFarmer,
};
