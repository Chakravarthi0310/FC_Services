const adminService = require('./admin.service');

const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await adminService.getDashboardStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats,
};
