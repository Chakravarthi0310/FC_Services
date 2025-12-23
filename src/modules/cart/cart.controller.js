const cartService = require('./cart.service');

const getCart = async (req, res, next) => {
    try {
        const cart = await cartService.getCart(req.user._id);
        res.json(cart);
    } catch (error) {
        next(error);
    }
};

const addToCart = async (req, res, next) => {
    try {
        const { productId, quantity } = req.body;
        const cart = await cartService.addToCart(req.user._id, productId, quantity);
        res.json(cart);
    } catch (error) {
        next(error);
    }
};

const updateCartItem = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        const cart = await cartService.updateCartItem(req.user._id, productId, quantity);
        res.json(cart);
    } catch (error) {
        next(error);
    }
};

const removeItem = async (req, res, next) => {
    try {
        const cart = await cartService.removeItem(req.user._id, req.params.productId);
        res.json(cart);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeItem,
};
