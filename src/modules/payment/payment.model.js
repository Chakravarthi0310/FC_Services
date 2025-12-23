const mongoose = require('mongoose');
const { paymentProvider, paymentStatus } = require('../../common/constants/payment');

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'INR',
    },
    provider: {
        type: String,
        enum: Object.values(paymentProvider),
        default: paymentProvider.RAZORPAY,
    },
    status: {
        type: String,
        enum: Object.values(paymentStatus),
        default: paymentStatus.CREATED,
    },
    providerPaymentId: {
        type: String,
    },
    providerOrderId: {
        type: String,
        required: true,
    },
    providerSignature: {
        type: String,
    },
}, {
    timestamps: true,
});

// Payment is immutable after SUCCESS
paymentSchema.pre('save', function (next) {
    if (this.isModified() && !this.isNew && this.status === paymentStatus.SUCCESS) {
        const error = new Error('Cannot modify payment after SUCCESS');
        return next(error);
    }
    next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
