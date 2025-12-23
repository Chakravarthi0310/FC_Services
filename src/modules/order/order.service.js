const Order = require('./order.model');
const Cart = require('../cart/cart.model');
const Product = require('../product/product.model');
const ApiError = require('../../common/errors/ApiError');
const { orderStatus } = require('../../common/constants/order');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../common/utils/logger');

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
                throw new ApiError(400, `Product ${cartItem.productId.name} is no longer available`);
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
            });

            totalAmount += product.price * cartItem.quantity;
        }

        // Generate unique order number
        const orderNumber = generateOrderNumber();

        // Create order
        const order = await Order.create([{
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

        // Audit logging
        logger.info('Order created', {
            orderNumber,
            userId,
            totalAmount: order[0].totalAmount,
            itemCount: orderItems.length,
            inventoryChanges,
        });

        return order[0].populate('items.farmerId', 'farmName');
    } catch (error) {
        await session.abortTransaction();
        logger.error('Order creation failed', {
            userId,
            error: error.message,
        });
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Cancel order and restore inventory
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

        // Only allow cancellation for CREATED or PAYMENT_PENDING orders
        if (![orderStatus.CREATED, orderStatus.PAYMENT_PENDING].includes(order.status)) {
            throw new ApiError(400, `Cannot cancel order with status: ${order.status}`);
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

        // Update order status
        order.status = orderStatus.CANCELLED;
        await order.save({ session });

        await session.commitTransaction();

        // Audit logging
        logger.info('Order cancelled', {
            orderNumber: order.orderNumber,
            userId,
            inventoryRestorations,
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
 * @returns {Promise<Order[]>}
 */
const getUserOrders = async (userId) => {
    return Order.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Get order by ID
 * @param {string} orderId
 * @param {string} userId
 * @returns {Promise<Order>}
 */
const getOrderById = async (orderId, userId) => {
    const order = await Order.findOne({ _id: orderId, userId });
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
 * @returns {Promise<Order[]>}
 */
const getAllOrders = async (status) => {
    const filter = status ? { status } : {};
    return Order.find(filter).sort({ createdAt: -1 }).populate('userId', 'name email');
};

module.exports = {
    createOrder,
    cancelOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    getAllOrders,
};
