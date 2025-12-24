/**
 * Paginate results for a mongoose model
 * @param {Object} model - Mongoose model
 * @param {Object} query - Query object
 * @param {Object} options - Pagination options { page, limit, populate, sort }
 * @returns {Promise<Object>} { docs, total, page, pages, limit }
 */
const paginate = async (model, query = {}, options = {}) => {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const populate = options.populate || [];
    const sort = options.sort || { createdAt: -1 };

    const [docs, total] = await Promise.all([
        model.find(query).sort(sort).skip(skip).limit(limit).populate(populate),
        model.countDocuments(query)
    ]);

    const pages = Math.ceil(total / limit);

    return {
        docs,
        total,
        page,
        pages,
        limit
    };
};

module.exports = paginate;
