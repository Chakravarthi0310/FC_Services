require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/user/user.model');
const config = require('./src/config/env');

/**
 * Script to create an admin user
 * Usage: node create-admin.js
 */

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Admin user details
        const adminData = {
            name: 'Admin User',
            email: 'admin@fcservices.com',
            password: 'Admin@123',
            role: 'ADMIN',
            status: 'ACTIVE',
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists with email:', adminData.email);
            console.log('📧 Email:', adminData.email);
            console.log('🔑 Password: Admin@123');
            process.exit(0);
        }

        // Create admin user
        const admin = await User.create(adminData);
        console.log('✅ Admin user created successfully!');
        console.log('\n📋 Admin Credentials:');
        console.log('📧 Email:', adminData.email);
        console.log('🔑 Password:', adminData.password);
        console.log('\n🚀 You can now login at: http://localhost:3000/login');
        console.log('📊 Admin Dashboard: http://localhost:3000/admin/dashboard');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        process.exit(1);
    }
};

createAdminUser();
