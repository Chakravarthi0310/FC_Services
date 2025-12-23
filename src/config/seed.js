const Category = require('../modules/category/category.model');
const { categoryNames } = require('../common/constants/product');
const logger = require('../common/utils/logger');

const seedCategories = async () => {
    try {
        for (const name of categoryNames) {
            const slug = name.toLowerCase();
            await Category.findOneAndUpdate(
                { slug },
                { name, slug },
                { upsert: true, new: true }
            );
        }
        logger.info('✅ Categories seeded successfully');
    } catch (error) {
        logger.error('❌ Error seeding categories:', error);
    }
};

module.exports = seedCategories;
