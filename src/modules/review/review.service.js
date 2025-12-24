const Review = require('./review.model');
const Product = require('../product/product.model');
const ApiError = require('../../common/errors/ApiError');
const paginate = require('../../common/utils/paginate');
const mongoose = require('mongoose');

/**
 * Add a review and update product stats
 * @param {string} userId
 * @param {Object} data
 * @returns {Promise<Review>}
 */
const addReview = async (userId, data) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { productId, rating, comment } = data;

        // Check if product exists
        const product = await Product.findById(productId).session(session);
        if (!product) {
            throw new ApiError(404, 'Product not found');
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({ userId, productId }).session(session);
        if (existingReview) {
            throw new ApiError(400, 'You have already reviewed this product');
        }

        // Create review
        const [review] = await Review.create([{
            userId,
            productId,
            rating,
            comment
        }], { session });

        // Update product stats
        const stats = await Review.aggregate([
            { $match: { productId: new mongoose.Types.ObjectId(productId) } }, // Use review within transaction? No, usage of newly created doc in aggregation inside transaction is tricky.
            // Better to just increment/update manually or fetch all reviews if volume low.
            // Or rely on atomic update with $inc and recalculate average.
        ]).session(session);

        // Simpler approach for average calculation:
        // New Average = ((Old Average * Old Count) + New Rating) / New Count
        const newCount = product.ratingCount + 1;
        const newAverage = ((product.averageRating * product.ratingCount) + rating) / newCount;

        await Product.findByIdAndUpdate(productId, {
            ratingCount: newCount,
            averageRating: Number(newAverage.toFixed(1))
        }, { session });

        await session.commitTransaction();
        return review;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Get reviews for a product
 * @param {string} productId
 * @param {Object} options
 * @returns {Promise<Object>}
 */
const getProductReviews = async (productId, options = {}) => {
    return paginate(Review, { productId }, {
        ...options,
        populate: { path: 'userId', select: 'name' },
        sort: { createdAt: -1 }
    });
};

/**
 * Delete a review
 * @param {string} reviewId
 * @param {string} userId
 */
const deleteReview = async (reviewId, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const review = await Review.findOneAndDelete({ _id: reviewId, userId }).session(session);
        if (!review) {
            throw new ApiError(404, 'Review not found or unauthorized');
        }

        const product = await Product.findById(review.productId).session(session);
        if (product) {
            // Recalculate stats
            // If count becomes 0, avg is 0.
            const newCount = product.ratingCount - 1;
            let newAverage = 0;

            if (newCount > 0) {
                newAverage = ((product.averageRating * product.ratingCount) - review.rating) / newCount;
            }

            await Product.findByIdAndUpdate(review.productId, {
                ratingCount: newCount,
                averageRating: Number(newAverage.toFixed(1))
            }, { session });
        }

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Get reviews for a farmer's products
 * @param {string} farmerId
 * @param {Object} options
 * @returns {Promise<Object>}
 */
const getFarmerReviews = async (farmerId, options = {}) => {
    // Find all products belonging to this farmer
    const products = await Product.find({ farmerId }).select('_id');
    const productIds = products.map(p => p._id);

    return paginate(Review, { productId: { $in: productIds } }, {
        ...options,
        populate: [
            { path: 'userId', select: 'name' },
            { path: 'productId', select: 'name images' }
        ],
        sort: { createdAt: -1 }
    });
};

module.exports = {
    addReview,
    getProductReviews,
    deleteReview,
    getFarmerReviews
};
