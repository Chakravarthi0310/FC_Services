const Order = require('./order.model');
const Cart = require('../cart/cart.model');
const Product = require('../product/product.model');
const ApiError = require('../../common/errors/ApiError');
const { orderStatus } = require('../../common/constants/order');

/**
 * Create order from cart with atomic inventory deduction
 * @param {string} userId
 * @param {Object} deliveryAddress
 * @returns {Promise<Order>}
 */
const createOrder = async (userId, deliveryAddress) => {
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
        throw new ApiError(400, 'Cart is empty');
    }

    // Prepare order items with product snapshots
    const orderItems = [];
    let totalAmount = 0;

    for (const cartItem of cart.items) {
        const product = await Product.findById(cartItem.productId._id);

        if (!product || !product.isActive) {
            throw new ApiError(400, `Product ${cartItem.productId.name} is no longer available`);
        }

        // Hard Check: Atomic stock validation
        if (product.stock < cartItem.quantity) {
            throw new ApiError(400, `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${cartItem.quantity}`);
        }

        // Deduct inventory atomically
        product.stock -= cartItem.quantity;
        await product.save();

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

    // Create order
    const order = await Order.create({
        userId,
        items: orderItems,
        totalAmount: Number(totalAmount.toFixed(2)),
        deliveryAddress,
        status: orderStatus.CREATED,
    });

    // Clear cart after successful order
    await Cart.findOneAndUpdate({ userId }, { items: [] });

    return order.populate('items.farmerId', 'farmName');
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

    order.status = newStatus;
    await order.save();
    return order;
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
};
