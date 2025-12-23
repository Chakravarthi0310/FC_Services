const express = require('express');
const { authenticate, authorize } = require('../../common/middleware/auth');
const validate = require('../../common/middleware/validate');
const paymentValidation = require('./payment.validation');
const paymentController = require('./payment.controller');
const { roles } = require('../../common/constants/roles');

const router = express.Router();

// Webhook endpoint (NO authentication - Razorpay calls this)
router.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    paymentController.handleWebhook
);

// All other payment routes require authentication and customer role
router.use(authenticate, authorize(roles.CUSTOMER));

// Create payment order
router.post(
    '/create-order',
    validate(paymentValidation.createPaymentOrder),
    paymentController.createPaymentOrder
);

// Check payment status (for polling in case of webhook delay)
router.get(
    '/status/:orderId',
    validate(paymentValidation.getPayment),
    paymentController.checkPaymentStatus
);

// Verify payment (DEPRECATED - use webhook for production)
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
