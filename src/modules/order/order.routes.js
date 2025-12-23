const express = require('express');
const { authenticate, authorize } = require('../../common/middleware/auth');
const validate = require('../../common/middleware/validate');
const orderValidation = require('./order.validation');
const orderController = require('./order.controller');
const { roles } = require('../../common/constants/roles');

const router = express.Router();

// Customer routes
router.post(
    '/',
    authenticate,
    authorize(roles.CUSTOMER),
    validate(orderValidation.createOrder),
    orderController.createOrder
);

router.get(
    '/',
    authenticate,
    authorize(roles.CUSTOMER),
    orderController.getUserOrders
);

router.get(
    '/:orderId',
    authenticate,
    authorize(roles.CUSTOMER),
    validate(orderValidation.getOrder),
    orderController.getOrderById
);

// Cancel order (Customer only)
router.post(
    '/:orderId/cancel',
    authenticate,
    authorize(roles.CUSTOMER),
    validate(orderValidation.getOrder),
    orderController.cancelOrder
);

// Admin routes
router.get(
    '/admin/all',
    authenticate,
    authorize(roles.ADMIN),
    orderController.getAllOrders
);

router.patch(
    '/:orderId/status',
    authenticate,
    authorize(roles.ADMIN),
    validate(orderValidation.updateOrderStatus),
    orderController.updateOrderStatus
);

module.exports = router;
