const orderService = require('./order.service');

const createOrder = async (req, res, next) => {
    try {
        const { deliveryAddress } = req.body;
        const order = await orderService.createOrder(req.user._id, deliveryAddress);
        res.status(201).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

const getUserOrders = async (req, res, next) => {
    try {
        const orders = await orderService.getUserOrders(req.user._id);
        res.json({ success: true, data: orders });
    } catch (error) {
        next(error);
    }
};

const getOrderById = async (req, res, next) => {
    try {
        const order = await orderService.getOrderById(req.params.orderId, req.user._id);
        res.json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const order = await orderService.updateOrderStatus(req.params.orderId, status);
        res.json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

const cancelOrder = async (req, res, next) => {
    try {
        const order = await orderService.cancelOrder(req.params.orderId, req.user._id);
        res.json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

// Admin-only: Get all orders with optional status filter
const getAllOrders = async (req, res, next) => {
    try {
        const { status } = req.query;
        const orders = await orderService.getAllOrders(status);
        res.json({ success: true, data: orders });
    } catch (error) {
        next(error);
    }
};

// Farmer-only: Get orders containing farmer's products
const getFarmerOrders = async (req, res, next) => {
    try {
        const orders = await orderService.getFarmerOrders(req.user._id);
        res.json({ success: true, data: orders });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    getAllOrders,
    getFarmerOrders,
};
