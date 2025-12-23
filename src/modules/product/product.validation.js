const { z } = require('zod');
const { productUnitNames } = require('../../common/constants/product');

const createProduct = {
    body: z.object({
        name: z.string().min(2).max(100),
        description: z.string().min(10).max(1000),
        price: z.number().positive(),
        unit: z.enum(productUnitNames),
        stock: z.number().min(0),
        category: z.string().regex(/^[0-9a-fA-F]{24}$/), // Category ID
        images: z.array(z.string().url()).optional(),
    }),
};

const updateProduct = {
    params: z.object({
        productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    }),
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        description: z.string().min(10).max(1000).optional(),
        price: z.number().positive().optional(),
        unit: z.enum(productUnitNames).optional(),
        stock: z.number().min(0).optional(),
        category: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
        images: z.array(z.string().url()).optional(),
        isActive: z.boolean().optional(),
    }),
};

const getProduct = {
    params: z.object({
        productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    }),
};

const getUploadUrl = {
    params: z.object({
        productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    }),
    body: z.object({
        contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    }),
};

module.exports = {
    createProduct,
    updateProduct,
    getProduct,
    getUploadUrl,
};
