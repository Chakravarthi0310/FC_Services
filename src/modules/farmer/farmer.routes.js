const express = require('express');
const { authenticate, authorize } = require('../../common/middleware/auth');
const validate = require('../../common/middleware/validate');
const farmerValidation = require('./farmer.validation');
const farmerController = require('./farmer.controller');
const { roles } = require('../../common/constants/roles');

const router = express.Router();

// General farmer profile access
router
    .route('/')
    .post(authenticate, authorize(roles.FARMER), validate(farmerValidation.createProfile), farmerController.createProfile)
    .get(authenticate, authorize(roles.FARMER), farmerController.getMyProfile);

// Admin-only routes
router
    .route('/admin/all')
    .get(authenticate, authorize(roles.ADMIN), farmerController.getAllFarmers);

router
    .route('/admin/pending')
    .get(authenticate, authorize(roles.ADMIN), farmerController.getPendingFarmers);

router
    .route('/verify/:userId')
    .patch(authenticate, authorize(roles.ADMIN), validate(farmerValidation.verifyFarmer), farmerController.verifyFarmer);

module.exports = router;
