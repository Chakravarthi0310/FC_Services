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
    if (this.isNew) return;

    // We only care if the document is being modified
    if (this.isModified()) {
        // Fetch the current state from the database to check if it WAS already success
        const currentDoc = await this.constructor.findById(this._id).lean();

        if (currentDoc && currentDoc.status === paymentStatus.SUCCESS) {
            // Already success. Only allow transition to REFUNDED
            if (this.isModified('status') && this.status === paymentStatus.REFUNDED) {
                return;
            }
            throw new Error('Cannot modify payment after SUCCESS');
        }
    }
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
