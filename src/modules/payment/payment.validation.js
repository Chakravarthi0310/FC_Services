const { z } = require('zod');

const createPaymentOrder = {
    body: z.object({
        orderId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    }),
};

const verifyPayment = {
    params: z.object({
        paymentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    }),
    body: z.object({
        razorpay_order_id: z.string(),
        razorpay_payment_id: z.string(),
        razorpay_signature: z.string(),
    }),
};

const getPayment = {
    params: z.object({
        orderId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    }),
};

module.exports = {
    createPaymentOrder,
    verifyPayment,
    getPayment,
};
