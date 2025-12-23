const mongoose = require('mongoose');
const { farmerVerificationStatus, farmerVerificationStatusNames } = require('../../common/constants/farmer');

const farmerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    farmName: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    address: {
        type: String,
        required: true,
        trim: true,
    },
    verificationStatus: {
        type: String,
        enum: farmerVerificationStatusNames,
        default: farmerVerificationStatus.PENDING,
    },
}, {
    timestamps: true,
});

const Farmer = mongoose.model('Farmer', farmerSchema);

module.exports = Farmer;
