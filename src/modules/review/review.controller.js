const reviewService = require('./review.service');

const addReview = async (req, res, next) => {
    try {
        const review = await reviewService.addReview(req.user._id, req.body);
        res.status(201).json({ success: true, data: review });
    } catch (error) {
        next(error);
    }
};

const getProductReviews = async (req, res, next) => {
    try {
        const reviews = await reviewService.getProductReviews(req.params.productId, req.query);
        res.json({ success: true, data: reviews });
    } catch (error) {
        next(error);
    }
};

const deleteReview = async (req, res, next) => {
    try {
        await reviewService.deleteReview(req.params.reviewId, req.user._id);
        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        next(error);
    }
};

const getFarmerReviews = async (req, res, next) => {
    try {
        // Need to find farmer profile for the logged in user first
        const Farmer = require('../farmer/farmer.model');
        const farmer = await Farmer.findOne({ userId: req.user._id });
        if (!farmer) {
            throw new Error('Farmer profile not found');
        }

        const reviews = await reviewService.getFarmerReviews(farmer._id, req.query);
        res.json({ success: true, data: reviews });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addReview,
    getProductReviews,
    deleteReview,
    getFarmerReviews
};
