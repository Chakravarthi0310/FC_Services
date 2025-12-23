const express = require('express');
const { authenticate, authorize } = require('../../common/middleware/auth');
const validate = require('../../common/middleware/validate');
const cartValidation = require('./cart.validation');
const cartController = require('./cart.controller');
const { roles } = require('../../common/constants/roles');

const router = express.Router();

// All cart routes require authentication and customer role
router.use(authenticate, authorize(roles.CUSTOMER));

router
    .route('/')
    .get(cartController.getCart)
    .post(validate(cartValidation.addToCart), cartController.addToCart)
    .delete(cartController.clearCart);

router
    .route('/:productId')
    .patch(validate(cartValidation.updateCartItem), cartController.updateCartItem)
    .delete(validate(cartValidation.removeItem), cartController.removeItem);

module.exports = router;
