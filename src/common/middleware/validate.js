const httpStatus = require('http-status');
const ApiError = require('../errors/ApiError');

const validate = (schema) => (req, res, next) => {
    const validSchema = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
    });

    if (!validSchema.success) {
        const errorMessage = validSchema.error.issues
            .map((issue) => issue.message)
            .join(', ');
        return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
    }

    Object.assign(req, validSchema.data);
    return next();
};

module.exports = validate;
