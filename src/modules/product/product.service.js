const Product = require('./product.model');
const Farmer = require('../farmer/farmer.model');
const ApiError = require('../../common/errors/ApiError');
const { farmerVerificationStatus } = require('../../common/constants/farmer');
const { generatePresignedUrl } = require('../../common/utils/s3');

/**
 * Create a new product
 * @param {string} userId
 * @param {Object} productData
 * @returns {Promise<Product>}
 */
const createProduct = async (userId, productData) => {
    const farmer = await Farmer.findOne({ userId });
    if (!farmer) {
        throw new ApiError(400, 'Farmer profile not found. Please create a profile first.');
    }

    if (farmer.verificationStatus !== farmerVerificationStatus.APPROVED) {
        throw new ApiError(403, 'Your farmer profile must be APPROVED to list products.');
    }

    return Product.create({
        farmerId: farmer._id,
        ...productData,
    });
};

/**
 * Update a product
 * @param {string} userId
 * @param {string} productId
 * @param {Object} updateData
 * @returns {Promise<Product>}
 */
const updateProduct = async (userId, productId, updateData) => {
    const farmer = await Farmer.findOne({ userId });
    if (!farmer) {
        throw new ApiError(403, 'Forbidden');
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    // Ensure ownership
    if (product.farmerId.toString() !== farmer._id.toString()) {
        throw new ApiError(403, 'You can only update your own products');
    }

    Object.assign(product, updateData);
    await product.save();
    return product;
};

/**
 * Soft delete a product
 * @param {string} userId
 * @param {string} productId
 * @returns {Promise<Product>}
 */
const deleteProduct = async (userId, productId) => {
    const farmer = await Farmer.findOne({ userId });
    if (!farmer) {
        throw new ApiError(403, 'Forbidden');
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    if (product.farmerId.toString() !== farmer._id.toString()) {
        throw new ApiError(403, 'You can only delete your own products');
    }

    product.isActive = false;
    await product.save();
    return product;
};

/**
 * Query products
 * @param {Object} filter
 * @returns {Promise<QueryResult>}
 */
const queryProducts = async (filter = {}) => {
    return Product.find({ isActive: true, ...filter }).populate('category', 'name');
};

/**
 * Generate a presigned upload URL for a product image
 * @param {string} userId
 * @param {string} productId
 * @param {string} contentType
 * @returns {Promise<Object>} uploadUrl and imageUrl
 */
const generateUploadUrl = async (userId, productId, contentType) => {
    const farmer = await Farmer.findOne({ userId });
    if (!farmer) {
        throw new ApiError(403, 'Forbidden');
    }

    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    // Ensure ownership
    if (product.farmerId.toString() !== farmer._id.toString()) {
        throw new ApiError(403, 'You can only upload images to your own products');
    }

    // Max image limit
    if (product.images.length >= 5) {
        throw new ApiError(400, 'Maximum of 5 images allowed per product');
    }

    const extension = contentType.split('/')[1] || 'jpg';
    const timestamp = Date.now();
    const key = `products/${farmer._id}/${product._id}/image-${timestamp}.${extension}`;

    const uploadUrl = await generatePresignedUrl(key, contentType);
    const config = require('../../config/env');
    const imageUrl = `https://${config.AWS_S3_BUCKET_NAME}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;

    return { uploadUrl, imageUrl };
};

/**
 * Get product by ID
 * @param {string} productId
 * @returns {Promise<Product>}
 */
const getProductById = async (productId) => {
    const product = await Product.findById(productId).populate('category', 'name');
    if (!product) {
        throw new ApiError(404, 'Product not found');
    }
    return product;
};

module.exports = {
    createProduct,
    updateProduct,
    deleteProduct,
    queryProducts,
    generateUploadUrl,
    getProductById,
};
