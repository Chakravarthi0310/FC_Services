const express = require('express');
const { authenticate, authorize } = require('../../common/middleware/auth');
const validate = require('../../common/middleware/validate');
const productValidation = require('./product.validation');
const productController = require('./product.controller');
const { roles } = require('../../common/constants/roles');

const router = express.Router();

// Public routes
router.get('/', productController.getProducts);

// Farmer only routes
router.post(
    '/',
    authenticate,
    authorize(roles.FARMER),
    validate(productValidation.createProduct),
    productController.createProduct
);

router
    .route('/:productId')
    .patch(
        authenticate,
        authorize(roles.FARMER),
        validate(productValidation.updateProduct),
        productController.updateProduct
    )
    .delete(
        authenticate,
        authorize(roles.FARMER),
        validate(productValidation.getProduct),
        productController.deleteProduct
    );

router.post(
    '/:productId/image-upload-url',
    authenticate,
    authorize(roles.FARMER),
    validate(productValidation.getUploadUrl),
    productController.getUploadUrl
);

module.exports = router;
