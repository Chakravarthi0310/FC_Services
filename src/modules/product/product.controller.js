const productService = require('./product.service');

const createProduct = async (req, res, next) => {
    try {
        const product = await productService.createProduct(req.user._id, req.body);
        res.status(201).json(product);
    } catch (error) {
        next(error);
    }
};

const updateProduct = async (req, res, next) => {
    try {
        const product = await productService.updateProduct(req.user._id, req.params.productId, req.body);
        res.json(product);
    } catch (error) {
        next(error);
    }
};

const deleteProduct = async (req, res, next) => {
    try {
        await productService.deleteProduct(req.user._id, req.params.productId);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        next(error);
    }
};

const getProducts = async (req, res, next) => {
    try {
        const products = await productService.queryProducts(req.query);
        res.json(products);
    } catch (error) {
        next(error);
    }
};

const getUploadUrl = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { contentType } = req.body;
        const result = await productService.generateUploadUrl(req.user._id, productId, contentType);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createProduct,
    updateProduct,
    deleteProduct,
    getProducts,
    getUploadUrl,
};
