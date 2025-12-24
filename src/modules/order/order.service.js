const Order = require('./order.model');
const Cart = require('../cart/cart.model');
const Product = require('../product/product.model');
const Payment = require('../payment/payment.model');
const ApiError = require('../../common/errors/ApiError');
const { orderStatus } = require('../../common/constants/order');
const { paymentStatus } = require('../../common/constants/payment');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../common/utils/logger');
const razorpay = require('../../config/razorpay');
const paginate = require('../../common/utils/paginate');

/**
 * Generate unique order number
 * @returns {string}
 */
const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = uuidv4().split('-')[0].toUpperCase();
    return `ORD-${timestamp}-${random}`;
};

/**
 * Create order from cart with atomic inventory deduction
 * @param {string} userId
 * @param {Object} deliveryAddress
 * @returns {Promise<Order>}
 */
const createOrder = async (userId, deliveryAddress) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const cart = await Cart.findOne({ userId }).populate('items.productId').session(session);

        if (!cart || cart.items.length === 0) {
            throw new ApiError(400, 'Cart is empty');
        }

        // Prepare order items with product snapshots
        const orderItems = [];
        let totalAmount = 0;
        const inventoryChanges = [];

        for (const cartItem of cart.items) {
            // Re-fetch product with session lock
            const product = await Product.findById(cartItem.productId._id).session(session);

            if (!product || !product.isActive) {
                logger.warn(`Product ${cartItem.productId?.name || 'Unknown'} skipped in checkout - no longer available`);
                continue;
            }

            // Hard Check: Atomic stock validation
            if (product.stock < cartItem.quantity) {
                throw new ApiError(400, `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${cartItem.quantity}`);
            }

            // Atomic inventory deduction using findOneAndUpdate
            const updatedProduct = await Product.findOneAndUpdate(
                { _id: product._id, stock: { $gte: cartItem.quantity } },
                { $inc: { stock: -cartItem.quantity } },
                { new: true, session }
            );

            if (!updatedProduct) {
                throw new ApiError(400, `Race condition detected: Insufficient stock for ${product.name}`);
            }

            // Track inventory changes for logging
            inventoryChanges.push({
                productId: product._id,
                productName: product.name,
                previousStock: product.stock,
                newStock: updatedProduct.stock,
                quantityDeducted: cartItem.quantity,
            });

            // Create order item snapshot
            orderItems.push({
                productId: product._id,
                farmerId: product.farmerId,
                name: product.name,
                price: product.price,
                quantity: cartItem.quantity,
                image: product.images && product.images.length > 0 ? product.images[0] : null,
            });

            totalAmount += product.price * cartItem.quantity;
        }

        if (orderItems.length === 0) {
            throw new ApiError(400, 'No valid items available for checkout. Your cart has been updated.');
        }

        // Generate unique order number
        const orderNumber = generateOrderNumber();

        // Create order
        const [order] = await Order.create([{
            orderNumber,
            userId,
            items: orderItems,
            totalAmount: Number(totalAmount.toFixed(2)),
            deliveryAddress,
            status: orderStatus.CREATED,
        }], { session });

        // Clear cart after successful order
        await Cart.findOneAndUpdate({ userId }, { items: [] }, { session });

        await session.commitTransaction();
        session.endSession(); // End session immediately after commit

        // Audit logging
        logger.info('Order created', {
            orderNumber,
            userId,
            totalAmount: order.totalAmount,
            itemCount: orderItems.length,
            inventoryChanges,
        });

        // Return the created order, populated for the response (without session)
        return Order.findById(order._id).populate('items.farmerId', 'farmName');
    } catch (error) {
        if (session.active) {
            await session.abortTransaction();
        }
        logger.error('Order creation failed', {
            userId,
            error: error.message,
        });
        throw error;
    } finally {
        if (session.active) {
            session.endSession();
        }
    }
};

/**
 * Cancel order and restore inventory (with refund if paid)
 * @param {string} orderId
 * @param {string} userId
 * @returns {Promise<Order>}
 */
const cancelOrder = async (orderId, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findOne({ _id: orderId, userId }).session(session);

        if (!order) {
            throw new ApiError(404, 'Order not found');
        }

        // REFUND RULE: Only allow cancellation before shipment
        const cancellableStatuses = [orderStatus.CREATED, orderStatus.PAYMENT_PENDING, orderStatus.PAID];
        if (!cancellableStatuses.includes(order.status)) {
            throw new ApiError(400, `Cannot cancel order with status: ${order.status}. Order already shipped.`);
        }

        const inventoryRestorations = [];

        // Restore inventory atomically
        for (const item of order.items) {
            const updatedProduct = await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: item.quantity } },
                { new: true, session }
            );

            inventoryRestorations.push({
                productId: item.productId,
                productName: item.name,
                quantityRestored: item.quantity,
                newStock: updatedProduct.stock,
            });
        }

        // Handle refund if order was paid
        let refundInfo = null;
        if (order.status === orderStatus.PAID) {
            const payment = await Payment.findOne({ orderId: order._id }).session(session);

            if (payment && payment.status === paymentStatus.SUCCESS) {
                try {
                    // Initiate Razorpay refund
                    const refund = await razorpay.payments.refund(payment.providerPaymentId, {
                        amount: Math.round(payment.amount * 100), // Full refund in paise
                        notes: {
                            orderNumber: order.orderNumber,
                            reason: 'Order cancelled by customer',
                        },
                    });

                    // Update payment record with refund details
                    payment.status = paymentStatus.REFUNDED;
                    payment.refundId = refund.id;
                    payment.refundAmount = payment.amount;
                    payment.refundedAt = new Date();
                    await payment.save({ session });

                    refundInfo = {
                        refundId: refund.id,
                        amount: payment.amount,
                    };

                    logger.info('Refund initiated', {
                        orderNumber: order.orderNumber,
                        paymentId: payment._id,
                        refundId: refund.id,
                        amount: payment.amount,
                    });
                } catch (refundError) {
                    logger.error('Refund initiation failed', {
                        orderNumber: order.orderNumber,
                        error: refundError.message,
                    });
                    // Don't block cancellation if refund fails - can be retried manually
                }
            }
        }

        // Update order status
        order.status = orderStatus.CANCELLED;
        await order.save({ session });

        await session.commitTransaction();

        // Audit logging
        logger.info('Order cancelled', {
            orderNumber: order.orderNumber,
            userId,
            inventoryRestorations,
            refundInitiated: !!refundInfo,
        });

        return order;
    } catch (error) {
        await session.abortTransaction();
        logger.error('Order cancellation failed', {
            orderId,
            userId,
            error: error.message,
        });
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Get user orders
 * @param {string} userId
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>}
 */
const getUserOrders = async (userId, options = {}) => {
    return paginate(Order, { userId }, {
        ...options,
        sort: { createdAt: -1 }
    });
};

/**
 * Get order by ID
 * @param {string} orderId
 * @param {string} userId
 * @returns {Promise<Order>}
 */
const getOrderById = async (orderId, userId) => {
    const order = await Order.findOne({ _id: orderId, userId }).populate('items.product');
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }
    return order;
};

/**
 * Update order status (Admin/Farmer only)
 * @param {string} orderId
 * @param {string} newStatus
 * @returns {Promise<Order>}
 */
const updateOrderStatus = async (orderId, newStatus) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, 'Order not found');
    }

    const previousStatus = order.status;
    order.status = newStatus;
    await order.save();

    // Audit logging
    logger.info('Order status updated', {
        orderNumber: order.orderNumber,
        previousStatus,
        newStatus,
    });

    return order;
};

/**
 * Get all orders (Admin only) with optional status filter
 * @param {string} status - Optional status filter
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>}
 */
const getAllOrders = async (status, options = {}) => {
    const filter = status ? { status } : {};
    return paginate(Order, filter, {
        ...options,
        populate: [
            { path: 'userId', select: 'name email' },
            { path: 'items.productId', select: 'name farmerId' }
        ],
        sort: { createdAt: -1 }
    });
};

/**
 * Get orders containing farmer's products
 * @param {string} userId - Farmer's user ID
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>}
 */
const getFarmerOrders = async (userId, options = {}) => {
    const Farmer = require('../farmer/farmer.model');

    // Get farmer profile
    const farmer = await Farmer.findOne({ userId });
    if (!farmer) {
        throw new ApiError(404, 'Farmer profile not found');
    }

    // Find orders that contain items from this farmer
    return paginate(Order, { 'items.farmerId': farmer._id }, {
        ...options,
        populate: [
            { path: 'userId', select: 'name email' },
            { path: 'items.productId', select: 'name images' }
        ],
        sort: { createdAt: -1 }
    });
};

module.exports = {
    createOrder,
    cancelOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    getAllOrders,
    getFarmerOrders,
};
