const paymentProvider = {
    RAZORPAY: 'RAZORPAY',
    STRIPE: 'STRIPE',
};

const paymentStatus = {
    CREATED: 'CREATED',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
};

module.exports = {
    paymentProvider,
    paymentStatus,
};
