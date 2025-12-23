const { z } = require('zod');

const createCategory = {
    body: z.object({
        name: z.string().min(2).max(50).trim(),
        description: z.string().max(200).trim().optional(),
    }),
};

const updateCategory = {
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/),
    }),
    body: z.object({
        name: z.string().min(2).max(50).trim().optional(),
        description: z.string().max(200).trim().optional(),
    }),
};

const getCategory = {
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/),
    }),
};

module.exports = {
    createCategory,
    updateCategory,
    getCategory,
};
