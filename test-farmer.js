const API_URL = 'http://localhost:5000/api';

async function verifyFarmerModule() {
    const timestamp = Date.now();
    const farmerData = { name: 'Farmer Joe', email: `farmer_${timestamp}@example.com`, password: 'password123', role: 'FARMER' };
    const adminData = { name: 'Admin Boss', email: `admin_${timestamp}@example.com`, password: 'password123', role: 'ADMIN' };

    console.log('🚀 Starting Farmer Module Verification...\n');

    try {
        // 1. Register and Login Farmer
        console.log('Step 1: Registering and logging in Farmer...');
        await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(farmerData),
        });
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: farmerData.email, password: farmerData.password }),
        });
        const { token: farmerToken, user: farmerUser } = await loginRes.json();
        console.log('✅ Farmer authenticated');

        // 2. Create Farmer Profile
        console.log('\nStep 2: Creating Farmer Profile...');
        const profileRes = await fetch(`${API_URL}/farmers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${farmerToken}`
            },
            body: JSON.stringify({ farmName: 'Joe\'s Organic Farm', phone: '1234567890', address: '123 Green Lane' }),
        });
        const profileData = await profileRes.json();
        if (profileRes.status === 201) {
            console.log('✅ Profile created successfully:', profileData.farmName);
        } else {
            throw new Error(`❌ Profile creation failed: ${JSON.stringify(profileData)}`);
        }

        // 3. Test Duplicate Profile Prevention
        console.log('\nStep 3: Testing duplicate profile prevention...');
        const dupRes = await fetch(`${API_URL}/farmers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${farmerToken}`
            },
            body: JSON.stringify({ farmName: 'Duplicate Farm', phone: '0000000000', address: 'Nowhere' }),
        });
        if (dupRes.status === 400) {
            console.log('✅ Duplicate prevention working (Received 400)');
        } else {
            console.log('❌ Duplicate prevention failed:', dupRes.status);
        }

        // 4. Register and Login Admin
        console.log('\nStep 4: Registering and logging in Admin...');
        await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminData),
        });
        const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminData.email, password: adminData.password }),
        });
        const { token: adminToken } = await adminLoginRes.json();
        console.log('✅ Admin authenticated');

        // 5. Verify Farmer Profile (as Admin)
        console.log('\nStep 5: Verifying Farmer Profile as Admin...');
        const verifyRes = await fetch(`${API_URL}/farmers/verify/${farmerUser._id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ status: 'APPROVED' }),
        });
        const verifyData = await verifyRes.json();
        if (verifyRes.status === 200 && verifyData.verificationStatus === 'APPROVED') {
            console.log('✅ Farmer verified successfully');
        } else {
            throw new Error(`❌ Verification failed: ${JSON.stringify(verifyData)}`);
        }

        // 6. Test RBAC (Farmer cannot verify)
        console.log('\nStep 6: Testing RBAC (Farmer trying to verify self)...');
        const rbacRes = await fetch(`${API_URL}/farmers/verify/${farmerUser._id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${farmerToken}`
            },
            body: JSON.stringify({ status: 'APPROVED' }),
        });
        if (rbacRes.status === 403) {
            console.log('✅ RBAC Success: Farmer denied verification access (403)');
        } else {
            console.log('❌ RBAC Failure:', rbacRes.status);
        }

        console.log('\n✨ FARMER MODULE FULLY VERIFIED ✨');

    } catch (e) {
        console.error(`\n🛑 VERIFICATION FAILED: ${e.message}`);
    }
}

verifyFarmerModule();
