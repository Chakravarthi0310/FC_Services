const Category = require('./category.model');
const ApiError = require('../../common/errors/ApiError');

/**
 * Generate slug from name
 * @param {string} name
 * @returns {string}
 */
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

/**
 * Get all categories
 * @returns {Promise<Category[]>}
 */
const getAllCategories = async () => {
    return Category.find().sort({ name: 1 });
};

/**
 * Get category by ID
 * @param {string} categoryId
 * @returns {Promise<Category>}
 */
const getCategoryById = async (categoryId) => {
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, 'Category not found');
    }
    return category;
};

/**
 * Create a new category
 * @param {Object} categoryData
 * @returns {Promise<Category>}
 */
const createCategory = async (categoryData) => {
    const existingCategory = await Category.findOne({ name: categoryData.name });
    if (existingCategory) {
        throw new ApiError(400, 'Category with this name already exists');
    }

    // Auto-generate slug from name
    const slug = generateSlug(categoryData.name);

    return Category.create({
        ...categoryData,
        slug,
    });
};

/**
 * Update a category
 * @param {string} categoryId
 * @param {Object} updateData
 * @returns {Promise<Category>}
 */
const updateCategory = async (categoryId, updateData) => {
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, 'Category not found');
    }

    // Check if name is being changed and if it conflicts
    if (updateData.name && updateData.name !== category.name) {
        const existingCategory = await Category.findOne({ name: updateData.name });
        if (existingCategory) {
            throw new ApiError(400, 'Category with this name already exists');
        }
        // Regenerate slug if name is changing
        updateData.slug = generateSlug(updateData.name);
    }

    Object.assign(category, updateData);
    await category.save();
    return category;
};

/**
 * Delete a category
 * @param {string} categoryId
 * @returns {Promise<void>}
 */
const deleteCategory = async (categoryId) => {
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new ApiError(404, 'Category not found');
    }

    // Check if any products are using this category
    const Product = require('../product/product.model');
    const productCount = await Product.countDocuments({ category: categoryId, isDeleted: false });
    if (productCount > 0) {
        throw new ApiError(400, `Cannot delete category. ${productCount} products are using this category`);
    }

    await category.deleteOne();
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};
