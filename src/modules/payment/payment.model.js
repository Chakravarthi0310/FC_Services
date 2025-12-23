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

// Payment is immutable after SUCCESS (except for refunds and filling missing provider info)
paymentSchema.pre('save', async function () {
    if (this.isNew) return;

    if (this.isModified()) {
        const currentDoc = await this.constructor.findById(this._id).lean();

        if (currentDoc && currentDoc.status === paymentStatus.SUCCESS) {
            // Already success. 
            // 1. Allow transition to REFUNDED
            if (this.isModified('status') && this.status === paymentStatus.REFUNDED) {
                return;
            }

            // 2. Allow filling in MISSING provider info (signature/id) if they weren't set
            const isFillingMissingInfo =
                (this.isModified('providerSignature') && !currentDoc.providerSignature) ||
                (this.isModified('providerPaymentId') && !currentDoc.providerPaymentId);

            if (isFillingMissingInfo && !this.isModified('amount') && !this.isModified('orderId')) {
                return;
            }

            // Otherwise, block any changes to a successful payment sensitive data
            throw new Error('Cannot modify sensitive payment data after SUCCESS');
        }
    }
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
