const Order = require('../order/order.model');
const Farmer = require('../farmer/farmer.model');
const Product = require('../product/product.model');
const { orderStatus } = require('../../common/constants/order');

/**
 * Get dashboard analytics
 * @returns {Promise<Object>}
 */
const getDashboardStats = async () => {
    // Get total orders count
    const totalOrders = await Order.countDocuments();

    // Calculate total revenue from PAID, CONFIRMED, SHIPPED, and DELIVERED orders
    const revenueResult = await Order.aggregate([
        {
            $match: {
                status: {
                    $in: [orderStatus.PAID, orderStatus.CONFIRMED, orderStatus.SHIPPED, orderStatus.DELIVERED]
                }
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$totalAmount' }
            }
        }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Get pending farmers count
    const pendingFarmers = await Farmer.countDocuments({ verificationStatus: 'PENDING' });

    // Get active products count (not deleted)
    const activeProducts = await Product.countDocuments({ isDeleted: false });

    // Get recent orders (last 5)
    const recentOrders = await Order.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(5);

    // Get pending farmers list (last 5)
    const pendingFarmersList = await Farmer.find({ verificationStatus: 'PENDING' })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(5);

    return {
        totalOrders,
        totalRevenue,
        pendingFarmers,
        activeProducts,
        recentOrders,
        pendingFarmersList,
    };
};

module.exports = {
    getDashboardStats,
};
