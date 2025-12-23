const express = require('express');
const { authenticate, authorize } = require('../../common/middleware/auth');
const adminController = require('./admin.controller');
const { roles } = require('../../common/constants/roles');

const router = express.Router();

// Admin-only analytics endpoint
router.get(
    '/analytics',
    authenticate,
    authorize(roles.ADMIN),
    adminController.getDashboardStats
);

module.exports = router;
