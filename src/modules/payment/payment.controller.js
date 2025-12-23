const paymentService = require('./payment.service');

const createPaymentOrder = async (req, res, next) => {
    console.log('>>> PAYMENT CONTROLLER: Received request for order:', req.body.orderId);
    try {
        const { orderId } = req.body;
        const paymentOrder = await paymentService.createPaymentOrder(orderId, req.user._id);
        console.log('<<< PAYMENT CONTROLLER: Responding with success');
        res.status(201).json({ success: true, data: paymentOrder });
    } catch (error) {
        console.error('!!! PAYMENT CONTROLLER ERROR:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            isApiError: error instanceof ApiError
        });
        next(error);
    }
};

const handleWebhook = async (req, res, next) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        await paymentService.handleWebhook(req.body, webhookSignature);
        res.json({ success: true, status: 'ok' });
    } catch (error) {
        next(error);
    }
};

const checkPaymentStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const status = await paymentService.checkPaymentStatus(orderId, req.user._id);
        res.json({ success: true, data: status });
    } catch (error) {
        next(error);
    }
};

const verifyPayment = async (req, res, next) => {
    try {
        const { paymentId } = req.params;
        const payment = await paymentService.verifyPayment(paymentId, req.body);
        res.json({ success: true, data: payment });
    } catch (error) {
        next(error);
    }
};

const getPaymentByOrderId = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const payment = await paymentService.getPaymentByOrderId(orderId, req.user._id);
        res.json({ success: true, data: payment });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPaymentOrder,
    handleWebhook,
    checkPaymentStatus,
    verifyPayment,
    getPaymentByOrderId,
};
