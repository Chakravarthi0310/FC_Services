const express = require('express');
const authRoute = require('./modules/auth/auth.routes');
const farmerRoute = require('./modules/farmer/farmer.routes');
const productRoute = require('./modules/product/product.routes');
const cartRoute = require('./modules/cart/cart.routes');

const { authenticate, authorize } = require('./common/middleware/auth');
const { roles } = require('./common/constants/roles');

const router = express.Router();

router.use('/auth', authRoute);
router.use('/farmers', farmerRoute);
router.use('/products', productRoute);
router.use('/cart', cartRoute);

router.get('/', (req, res) => {
    res.json({ message: 'Welcome to FC Services API' });
});

module.exports = router;
