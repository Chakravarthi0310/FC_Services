const { z } = require('zod');
const { orderStatus } = require('../../common/constants/order');

const createOrder = {
    body: z.object({
        deliveryAddress: z.object({
            street: z.string().min(5),
            city: z.string().min(2),
            state: z.string().min(2),
            zipCode: z.string().regex(/^\d{5,6}$/),
            country: z.string().min(2),
        }),
    }),
};

const getOrder = {
    params: z.object({
        orderId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    }),
};

const updateOrderStatus = {
    params: z.object({
        orderId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    }),
    body: z.object({
        status: z.enum(Object.values(orderStatus)),
    }),
};

module.exports = {
    createOrder,
    getOrder,
    updateOrderStatus,
};
