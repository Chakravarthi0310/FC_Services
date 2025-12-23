const Payment = require('./payment.model');
const Order = require('../order/order.model');
const razorpay = require('../../config/razorpay');
const ApiError = require('../../common/errors/ApiError');
const { paymentStatus } = require('../../common/constants/payment');
const { orderStatus } = require('../../common/constants/order');
const crypto = require('crypto');
const logger = require('../../common/utils/logger');

/**
 * Create Razorpay order for payment
 * @param {string} orderId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const createPaymentOrder = async (orderId, userId) => {
    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ orderId });
    if (existingPayment) {
        throw new ApiError(400, 'Payment already initiated for this order');
    }

    // Only allow payment for CREATED orders
    if (order.status !== orderStatus.CREATED) {
        throw new ApiError(400, `Cannot create payment for order with status: ${order.status}`);
    }

    try {
        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(order.totalAmount * 100), // Convert to paise
            currency: 'INR',
            receipt: order.orderNumber,
            notes: {
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
            },
        });

        // Create payment record
        const payment = await Payment.create({
            orderId: order._id,
            amount: order.totalAmount,
            currency: 'INR',
            providerOrderId: razorpayOrder.id,
            status: paymentStatus.CREATED,
        });

        // Update order status to PAYMENT_PENDING
        order.status = orderStatus.PAYMENT_PENDING;
        await order.save();

        logger.info('Payment order created', {
            orderNumber: order.orderNumber,
            paymentId: payment._id,
            razorpayOrderId: razorpayOrder.id,
            amount: order.totalAmount,
        });

        return {
            paymentId: payment._id,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            orderNumber: order.orderNumber,
        };
    } catch (error) {
        logger.error('Payment order creation failed', {
            orderId,
            error: error.message,
        });
        throw new ApiError(500, 'Failed to create payment order');
    }
};

/**
 * Verify Razorpay payment signature
 * @param {string} paymentId
 * @param {Object} paymentData
 * @returns {Promise<Payment>}
 */
const verifyPayment = async (paymentId, paymentData) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
        throw new ApiError(404, 'Payment not found');
    }

    if (payment.status === paymentStatus.SUCCESS) {
        throw new ApiError(400, 'Payment already verified');
    }

    // Verify signature
    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (generatedSignature !== razorpay_signature) {
        payment.status = paymentStatus.FAILED;
        await payment.save();

        logger.warn('Payment verification failed', {
            paymentId,
            razorpayOrderId: razorpay_order_id,
        });

        throw new ApiError(400, 'Invalid payment signature');
    }

    // Update payment record
    payment.providerPaymentId = razorpay_payment_id;
    payment.providerSignature = razorpay_signature;
    payment.status = paymentStatus.SUCCESS;
    await payment.save();

    // Update order status to PAID
    const order = await Order.findById(payment.orderId);
    order.status = orderStatus.PAID;
    order.paymentStatus = 'COMPLETED';
    await order.save();

    logger.info('Payment verified successfully', {
        paymentId,
        orderNumber: order.orderNumber,
        razorpayPaymentId: razorpay_payment_id,
    });

    return payment;
};

/**
 * Get payment by order ID
 * @param {string} orderId
 * @param {string} userId
 * @returns {Promise<Payment>}
 */
const getPaymentByOrderId = async (orderId, userId) => {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
        throw new ApiError(404, 'Payment not found');
    }

    return payment;
};

module.exports = {
    createPaymentOrder,
    verifyPayment,
    getPaymentByOrderId,
};
