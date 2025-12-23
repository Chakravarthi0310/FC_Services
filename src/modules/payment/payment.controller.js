const paymentService = require('./payment.service');

const createPaymentOrder = async (req, res, next) => {
    try {
        const { orderId } = req.body;
        const paymentOrder = await paymentService.createPaymentOrder(orderId, req.user._id);
        res.status(201).json(paymentOrder);
    } catch (error) {
        next(error);
    }
};

const verifyPayment = async (req, res, next) => {
    try {
        const { paymentId } = req.params;
        const payment = await paymentService.verifyPayment(paymentId, req.body);
        res.json({ success: true, payment });
    } catch (error) {
        next(error);
    }
};

const getPaymentByOrderId = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const payment = await paymentService.getPaymentByOrderId(orderId, req.user._id);
        res.json(payment);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPaymentOrder,
    verifyPayment,
    getPaymentByOrderId,
};
