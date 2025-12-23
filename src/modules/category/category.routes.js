const express = require('express');
const { authenticate, authorize } = require('../../common/middleware/auth');
const validate = require('../../common/middleware/validate');
const categoryValidation = require('./category.validation');
const categoryController = require('./category.controller');
const { roles } = require('../../common/constants/roles');

const router = express.Router();

// Public route - get all categories
router.get('/', categoryController.getAllCategories);

// Public route - get category by ID
router.get('/:id', validate(categoryValidation.getCategory), categoryController.getCategoryById);

// Admin-only routes
router.post(
    '/',
    authenticate,
    authorize(roles.ADMIN),
    validate(categoryValidation.createCategory),
    categoryController.createCategory
);

router.put(
    '/:id',
    authenticate,
    authorize(roles.ADMIN),
    validate(categoryValidation.updateCategory),
    categoryController.updateCategory
);

router.delete(
    '/:id',
    authenticate,
    authorize(roles.ADMIN),
    validate(categoryValidation.getCategory),
    categoryController.deleteCategory
);

module.exports = router;
