const Cart = require('./cart.model');
const Product = require('../product/product.model');
const ApiError = require('../../common/errors/ApiError');
const { MAX_QTY_PER_ITEM } = require('../../common/constants/cart');

/**
 * Add item to cart
 * @param {string} userId
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Object>} Refined cart with totals
 */
const addToCart = async (userId, productId, quantity) => {
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
        throw new ApiError(404, 'Product not found or inactive');
    }

    if (quantity > MAX_QTY_PER_ITEM) {
        throw new ApiError(400, `Cannot add more than ${MAX_QTY_PER_ITEM} of this item`);
    }

    if (product.stock < quantity) {
        throw new ApiError(400, `Only ${product.stock} items available in stock (Soft Check)`);
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
        cart = await Cart.create({
            userId,
            items: [{ productId, quantity, priceAtAddTime: product.price }],
        });
    } else {
        const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);

        if (itemIndex > -1) {
            const newQuantity = cart.items[itemIndex].quantity + quantity;

            if (newQuantity > MAX_QTY_PER_ITEM) {
                throw new ApiError(400, `Total items for this product cannot exceed ${MAX_QTY_PER_ITEM}`);
            }

            if (product.stock < newQuantity) {
                throw new ApiError(400, `Cannot add more. Total stock: ${product.stock}`);
            }
            cart.items[itemIndex].quantity = newQuantity;
            cart.items[itemIndex].priceAtAddTime = product.price;
        } else {
            cart.items.push({ productId, quantity, priceAtAddTime: product.price });
        }
        await cart.save();
    }

    return getCart(userId);
};

/**
 * Update cart item quantity (explicit set)
 * @param {string} userId
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Object>}
 */
const updateCartItem = async (userId, productId, quantity) => {
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
        throw new ApiError(404, 'Product not found or inactive');
    }

    if (quantity > MAX_QTY_PER_ITEM) {
        throw new ApiError(400, `Maximum allowed quantity is ${MAX_QTY_PER_ITEM}`);
    }

    if (product.stock < quantity) {
        throw new ApiError(400, `Only ${product.stock} items available in stock`);
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
        throw new ApiError(404, 'Cart not found');
    }

    const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);
    if (itemIndex === -1) {
        throw new ApiError(400, 'Item not found in cart');
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].priceAtAddTime = product.price;
    await cart.save();

    return getCart(userId);
};

/**
 * Get user cart with server-side calculations
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const getCart = async (userId) => {
    let cart = await Cart.findOne({ userId }).populate('items.productId', 'name price images unit isActive stock');

    if (!cart) {
        cart = await Cart.create({ userId, items: [] });
    }

    // Calculate subtotals and total server-side
    let cartTotal = 0;
    const items = [];

    cart.items.forEach((item) => {
        const product = item.productId;

        if (product && product.isActive) {
            const subtotal = product.price * item.quantity;
            cartTotal += subtotal;

            items.push({
                product: {
                    id: product._id,
                    name: product.name,
                    price: product.price,
                    images: product.images,
                    unit: product.unit,
                    availableStock: product.stock,
                    isVerified: true
                },
                quantity: item.quantity,
                subtotal: Number(subtotal.toFixed(2)),
            });
        } else {
            items.push({
                product: {
                    id: product ? product._id : item.productId,
                    name: product ? product.name : 'Unknown Product',
                    isVerified: false,
                    error: 'Product is no longer available'
                },
                quantity: item.quantity,
                subtotal: 0,
            });
        }
    });

    return {
        userId: cart.userId,
        items,
        total: Number(cartTotal.toFixed(2)),
        updatedAt: cart.updatedAt,
    };
};

/**
 * Remove item from cart
 * @param {string} userId
 * @param {string} productId
 * @returns {Promise<Object>}
 */
const removeItem = async (userId, productId) => {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
        throw new ApiError(404, 'Cart not found');
    }

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    await cart.save();

    return getCart(userId);
};

/**
 * Clear cart
 * @param {string} userId
 * @returns {Promise<void>}
 */
const clearCart = async (userId) => {
    await Cart.findOneAndUpdate({ userId }, { items: [] });
};

module.exports = {
    addToCart,
    updateCartItem,
    getCart,
    removeItem,
    clearCart,
};
