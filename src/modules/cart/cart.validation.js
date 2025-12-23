const { z } = require('zod');

const addToCart = {
    body: z.object({
        productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
        quantity: z.number().int().positive(),
    }),
};

const updateCartItem = {
    params: z.object({
        productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    }),
    body: z.object({
        quantity: z.number().int().positive(),
    }),
};

const removeItem = {
    params: z.object({
        productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    }),
};

module.exports = {
    addToCart,
    updateCartItem,
    removeItem,
};
