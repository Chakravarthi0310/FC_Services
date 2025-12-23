require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/user/user.model');
const Farmer = require('./src/modules/farmer/farmer.model');
const Product = require('./src/modules/product/product.model');
const Category = require('./src/modules/category/category.model');
const config = require('./src/config/env');

/**
 * Script to seed dummy farmers and products
 * Usage: node seed-data.js
 */

const seedData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get categories
        const categories = await Category.find();
        if (categories.length === 0) {
            console.log('❌ No categories found. Please run the server first to seed categories.');
            process.exit(1);
        }

        console.log(`📦 Found ${categories.length} categories`);

        // Create farmer users
        const farmerUsers = [
            {
                name: 'Rajesh Kumar',
                email: 'rajesh@farmer.com',
                password: 'Farmer@123',
                role: 'FARMER',
                status: 'ACTIVE',
            },
            {
                name: 'Priya Sharma',
                email: 'priya@farmer.com',
                password: 'Farmer@123',
                role: 'FARMER',
                status: 'ACTIVE',
            },
            {
                name: 'Amit Patel',
                email: 'amit@farmer.com',
                password: 'Farmer@123',
                role: 'FARMER',
                status: 'ACTIVE',
            },
        ];

        console.log('\n👨‍🌾 Creating farmer users...');
        const createdFarmers = [];

        for (const farmerData of farmerUsers) {
            const existing = await User.findOne({ email: farmerData.email });
            if (existing) {
                console.log(`   ⚠️  User ${farmerData.email} already exists`);
                createdFarmers.push(existing);
            } else {
                const user = await User.create(farmerData);
                console.log(`   ✅ Created user: ${farmerData.name}`);
                createdFarmers.push(user);
            }
        }

        // Create farmer profiles
        const farmerProfiles = [
            {
                userId: createdFarmers[0]._id,
                farmName: 'Green Valley Farms',
                phone: '+91-9876543210',
                address: 'Village Rampur, District Meerut, Uttar Pradesh - 250001',
                verificationStatus: 'APPROVED',
            },
            {
                userId: createdFarmers[1]._id,
                farmName: 'Sunshine Organic Farm',
                phone: '+91-9876543211',
                address: 'Khandala Road, Pune, Maharashtra - 411021',
                verificationStatus: 'PENDING',
            },
            {
                userId: createdFarmers[2]._id,
                farmName: 'Fresh Harvest Farms',
                phone: '+91-9876543212',
                address: 'NH-44, Coimbatore, Tamil Nadu - 641001',
                verificationStatus: 'APPROVED',
            },
        ];

        console.log('\n🌾 Creating farmer profiles...');
        const createdProfiles = [];

        for (const profileData of farmerProfiles) {
            const existing = await Farmer.findOne({ userId: profileData.userId });
            if (existing) {
                console.log(`   ⚠️  Profile for ${profileData.farmName} already exists`);
                createdProfiles.push(existing);
            } else {
                const profile = await Farmer.create(profileData);
                console.log(`   ✅ Created profile: ${profileData.farmName}`);
                createdProfiles.push(profile);
            }
        }

        // Create products
        const products = [
            // Vegetables
            {
                name: 'Fresh Tomatoes',
                description: 'Organic red tomatoes, freshly harvested',
                price: 40,
                unit: 'kg',
                stock: 100,
                category: categories.find(c => c.name === 'Vegetables')?._id,
                farmerId: createdProfiles[0]._id,
                images: ['https://via.placeholder.com/400x300/ff6b6b/ffffff?text=Tomatoes'],
            },
            {
                name: 'Green Spinach',
                description: 'Fresh organic spinach leaves',
                price: 30,
                unit: 'kg',
                stock: 50,
                category: categories.find(c => c.name === 'Vegetables')?._id,
                farmerId: createdProfiles[0]._id,
                images: ['https://via.placeholder.com/400x300/51cf66/ffffff?text=Spinach'],
            },
            {
                name: 'Carrots',
                description: 'Sweet and crunchy orange carrots',
                price: 35,
                unit: 'kg',
                stock: 75,
                category: categories.find(c => c.name === 'Vegetables')?._id,
                farmerId: createdProfiles[2]._id,
                images: ['https://via.placeholder.com/400x300/ff922b/ffffff?text=Carrots'],
            },
            // Fruits
            {
                name: 'Fresh Apples',
                description: 'Crispy red apples from Kashmir',
                price: 120,
                unit: 'kg',
                stock: 60,
                category: categories.find(c => c.name === 'Fruits')?._id,
                farmerId: createdProfiles[2]._id,
                images: ['https://via.placeholder.com/400x300/fa5252/ffffff?text=Apples'],
            },
            {
                name: 'Bananas',
                description: 'Fresh yellow bananas',
                price: 50,
                unit: 'dozen',
                stock: 100,
                category: categories.find(c => c.name === 'Fruits')?._id,
                farmerId: createdProfiles[0]._id,
                images: ['https://via.placeholder.com/400x300/ffd43b/ffffff?text=Bananas'],
            },
            // Dairy
            {
                name: 'Fresh Milk',
                description: 'Pure cow milk, delivered daily',
                price: 60,
                unit: 'kg',
                stock: 40,
                category: categories.find(c => c.name === 'Dairy')?._id,
                farmerId: createdProfiles[0]._id,
                images: ['https://via.placeholder.com/400x300/74c0fc/ffffff?text=Milk'],
            },
            // Grains
            {
                name: 'Organic Rice',
                description: 'Premium basmati rice',
                price: 80,
                unit: 'kg',
                stock: 200,
                category: categories.find(c => c.name === 'Grains')?._id,
                farmerId: createdProfiles[2]._id,
                images: ['https://via.placeholder.com/400x300/f1f3f5/333333?text=Rice'],
            },
            {
                name: 'Wheat Flour',
                description: 'Stone ground whole wheat flour',
                price: 45,
                unit: 'kg',
                stock: 150,
                category: categories.find(c => c.name === 'Grains')?._id,
                farmerId: createdProfiles[0]._id,
                images: ['https://via.placeholder.com/400x300/ffe066/333333?text=Wheat'],
            },
        ];

        console.log('\n🌽 Creating products...');
        let createdCount = 0;

        for (const productData of products) {
            const existing = await Product.findOne({
                name: productData.name,
                farmerId: productData.farmerId
            });

            if (existing) {
                console.log(`   ⚠️  Product ${productData.name} already exists`);
            } else {
                await Product.create(productData);
                console.log(`   ✅ Created product: ${productData.name}`);
                createdCount++;
            }
        }

        console.log('\n✅ Seed data created successfully!');
        console.log(`\n📊 Summary:`);
        console.log(`   - Farmer Users: ${createdFarmers.length}`);
        console.log(`   - Farmer Profiles: ${createdProfiles.length}`);
        console.log(`   - Products: ${createdCount} new (${products.length} total)`);
        console.log(`\n🔑 Farmer Login Credentials:`);
        console.log(`   Email: rajesh@farmer.com | Password: Farmer@123`);
        console.log(`   Email: priya@farmer.com  | Password: Farmer@123`);
        console.log(`   Email: amit@farmer.com   | Password: Farmer@123`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error.message);
        process.exit(1);
    }
};

seedData();
