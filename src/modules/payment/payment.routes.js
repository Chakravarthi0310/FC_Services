const express = require('express');
const { authenticate, authorize } = require('../../common/middleware/auth');
const validate = require('../../common/middleware/validate');
const paymentValidation = require('./payment.validation');
const paymentController = require('./payment.controller');
const { roles } = require('../../common/constants/roles');

const router = express.Router();

// All payment routes require authentication and customer role
router.use(authenticate, authorize(roles.CUSTOMER));

// Create payment order
router.post(
    '/create-order',
    validate(paymentValidation.createPaymentOrder),
    paymentController.createPaymentOrder
);

// Verify payment
router.post(
    '/:paymentId/verify',
    validate(paymentValidation.verifyPayment),
    paymentController.verifyPayment
);

// Get payment by order ID
router.get(
    '/order/:orderId',
    validate(paymentValidation.getPayment),
    paymentController.getPaymentByOrderId
);

module.exports = router;
