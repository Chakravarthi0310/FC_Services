const { z } = require('zod');
const ApiError = require('../errors/ApiError');

const validate = (schema) => (req, res, next) => {
    const object = {};
    const schemaObj = schema instanceof z.ZodType ? schema : z.object(schema);

    // Pick only what's in the schema from the request
    const schemaKeys = schema instanceof z.ZodType ? Object.keys(schema.shape || {}) : Object.keys(schema);

    schemaKeys.forEach((key) => {
        if (req[key]) object[key] = req[key];
    });

    const result = schemaObj.safeParse(object);

    if (!result.success) {
        const errorMessage = result.error.issues
            .map((issue) => issue.message)
            .join(', ');
        return next(new ApiError(400, errorMessage));
    }

    // Assign validated data back to req (only keys present in schema)
    Object.assign(req, result.data);
    return next();
};

module.exports = validate;
