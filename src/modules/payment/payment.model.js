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
    refundId: {
        type: String,
    },
    refundAmount: {
        type: Number,
    },
    refundedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});

// Payment is immutable after SUCCESS (except for refunds)
paymentSchema.pre('save', async function () {
    if (this.isModified() && !this.isNew && this.status === paymentStatus.SUCCESS) {
        // Allow transition to REFUNDED
        if (this.isModified('status') && this.status === paymentStatus.REFUNDED) {
            return;
        }
        throw new Error('Cannot modify payment after SUCCESS');
    }
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
