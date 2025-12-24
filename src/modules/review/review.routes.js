const express = require('express');
const router = express.Router();
const reviewController = require('./review.controller');
const { authenticate } = require('../../common/middleware/auth');

router.post('/', authenticate, reviewController.addReview);
router.get('/farmer/my-reviews', authenticate, reviewController.getFarmerReviews);
router.get('/:productId', reviewController.getProductReviews);
router.delete('/:reviewId', authenticate, reviewController.deleteReview);

module.exports = router;
