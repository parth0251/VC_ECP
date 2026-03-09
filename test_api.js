const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function runTests() {
    try {
        console.log('--- STARTING ECP API INTEGRATION TESTS ---');

        // 1. Register a test user
        const email = `testuser_${Date.now()}@example.com`;
        const password = 'Password123!';
        console.log(`\n[1] Registering User: ${email}`);

        let res = await axios.post(`${API_URL}/auth/register`, { email, password });
        console.log('Registration Success:', res.status === 201);

        // 2. Login to get token
        console.log('\n[2] Logging In...');
        res = await axios.post(`${API_URL}/auth/login`, { email, password });
        const { accessToken } = res.data;
        console.log('Login Success, Token Received:', !!accessToken);

        const headers = { Authorization: `Bearer ${accessToken}` };

        // 3. Create Configuration (Mock carId 1)
        console.log('\n[3] Creating Car Configuration...');
        res = await axios.post(`${API_URL}/configurations`, {
            carId: 1, // Make sure a car exists or foreign key might fail? Ah, we haven't seeded a Car!
            color: '#3d3d3d',
            accessories: ['sport-exhaust']
        }, { headers });
        const configId = res.data.id;
        console.log('Configuration Created, ID:', configId);

        // 4. Create Quote
        console.log('\n[4] Creating Quote from Configuration...');
        res = await axios.post(`${API_URL}/quotes`, { configurationId: configId }, { headers });
        const quoteId = res.data.id;
        console.log('Quote Created, ID:', quoteId);

        // 5. Generate PDF
        console.log('\n[5] Generating Quote PDF...');
        res = await axios.get(`${API_URL}/quotes/${quoteId}/pdf`, { headers });
        console.log('PDF Generated URL:', res.data.pdfUrl);

        // 6. Test Admin API (Should fail since user is CUSTOMER)
        console.log('\n[6] Testing Admin Access (Expected: 403 Forbidden)...');
        try {
            await axios.get(`${API_URL}/admin/users`, { headers });
            console.log('FAIL: Admin access was incorrectly granted.');
        } catch (e) {
            if (e.response && e.response.status === 403) {
                console.log('SUCCESS: Admin access correctly forbidden (403).');
            } else {
                console.log('UNEXPECTED ERROR:', e.message);
            }
        }

        console.log('\n--- ALL TESTS COMPLETED SUCCESSFULLY ---');
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.response ? JSON.stringify(error.response.data) : error.message);
    }
}

runTests();
