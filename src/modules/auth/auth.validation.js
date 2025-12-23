const { z } = require('zod');
const { roleNames } = require('../../common/constants/roles');

const register = {
    body: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(roleNames).optional(),
    }),
};

const login = {
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
};

module.exports = {
    register,
    login,
};
