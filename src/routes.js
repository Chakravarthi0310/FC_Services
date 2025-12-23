const express = require('express');
const authRoute = require('./modules/auth/auth.routes');
const farmerRoute = require('./modules/farmer/farmer.routes');
const productRoute = require('./modules/product/product.routes');
const cartRoute = require('./modules/cart/cart.routes');
const orderRoute = require('./modules/order/order.routes');
const paymentRoute = require('./modules/payment/payment.routes');
const categoryRoute = require('./modules/category/category.routes');
const adminRoute = require('./modules/admin/admin.routes');

const { authenticate, authorize } = require('./common/middleware/auth');
const { roles } = require('./common/constants/roles');

const router = express.Router();

router.use('/auth', authRoute);
router.use('/farmers', farmerRoute);
router.use('/products', productRoute);
router.use('/cart', cartRoute);
router.use('/orders', orderRoute);
router.use('/payments', paymentRoute);
router.use('/categories', categoryRoute);
router.use('/admin', adminRoute);

router.get('/', (req, res) => {
    res.json({ message: 'Welcome to FC Services API' });
});

module.exports = router;
