const Payment = require('./payment.model');
const Order = require('../order/order.model');
const razorpay = require('../../config/razorpay');
const ApiError = require('../../common/errors/ApiError');
const { paymentStatus } = require('../../common/constants/payment');
const { orderStatus } = require('../../common/constants/order');
const crypto = require('crypto');
const logger = require('../../common/utils/logger');
const config = require('../../config/env');

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
            razorpayKeyId: config.RAZORPAY_KEY_ID,
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
 * Handle Razorpay webhook (CRITICAL - Production Payment Verification)
 * @param {Object} webhookBody
 * @param {string} webhookSignature
 * @returns {Promise<void>}
 */
const handleWebhook = async (webhookBody, webhookSignature) => {
    // Verify webhook signature
    const expectedSignature = crypto
        .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
        .update(JSON.stringify(webhookBody))
        .digest('hex');

    if (expectedSignature !== webhookSignature) {
        logger.warn('Webhook signature verification failed', {
            receivedSignature: webhookSignature,
        });
        throw new ApiError(400, 'Invalid webhook signature');
    }

    const event = webhookBody.event;
    const paymentEntity = webhookBody.payload?.payment?.entity;

    logger.info('Webhook received', {
        event,
        paymentId: paymentEntity?.id,
    });

    // Handle payment.authorized event
    if (event === 'payment.authorized' || event === 'payment.captured') {
        const razorpayPaymentId = paymentEntity.id;
        const razorpayOrderId = paymentEntity.order_id;

        // Find payment by providerOrderId (idempotent - safe for duplicate webhooks)
        const payment = await Payment.findOne({ providerOrderId: razorpayOrderId });

        if (!payment) {
            logger.warn('Payment not found for webhook', {
                razorpayOrderId,
                razorpayPaymentId,
            });
            return; // Silently ignore - might be a test webhook
        }

        // Idempotency check - if already SUCCESS, skip
        if (payment.status === paymentStatus.SUCCESS) {
            logger.info('Payment already marked as SUCCESS (idempotent)', {
                paymentId: payment._id,
                razorpayPaymentId,
            });
            return;
        }

        // Update payment record
        payment.providerPaymentId = razorpayPaymentId;
        payment.status = paymentStatus.SUCCESS;
        await payment.save();

        // Update order status to PAID
        const order = await Order.findById(payment.orderId);
        if (order) {
            order.status = orderStatus.PAID;
            order.paymentStatus = 'COMPLETED';
            await order.save();

            logger.info('Payment verified via webhook', {
                paymentId: payment._id,
                orderNumber: order.orderNumber,
                razorpayPaymentId,
            });
        }
    } else if (event === 'payment.failed') {
        const razorpayOrderId = paymentEntity.order_id;
        const payment = await Payment.findOne({ providerOrderId: razorpayOrderId });

        if (payment && payment.status !== paymentStatus.FAILED) {
            payment.status = paymentStatus.FAILED;
            await payment.save();

            logger.warn('Payment failed via webhook', {
                paymentId: payment._id,
                razorpayPaymentId: paymentEntity.id,
            });
        }
    }
};

/**
 * Verify Razorpay payment signature (DEPRECATED - Use webhook for production)
 * This is kept for backward compatibility but webhooks are the secure method
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
        .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
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

    logger.info('Payment verified successfully (frontend method)', {
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
    handleWebhook,
    verifyPayment,
    getPaymentByOrderId,
};
