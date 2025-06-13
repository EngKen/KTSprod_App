const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
let authToken = null;

async function testAPI() {
    console.log('Testing API endpoints...\n');

    try {
        // 1. Test health endpoint
        console.log('1. Testing health endpoint...');
        const health = await axios.get(`${API_URL}/health`);
        console.log('Health check response:', health.data);
        console.log('✅ Health check passed\n');

        // 2. Test login
        console.log('2. Testing login...');
        const login = await axios.post(`${API_URL}/login`, {
            username: process.env.TEST_USERNAME,
            password: process.env.TEST_PASSWORD
        });
        authToken = login.data.token;
        console.log('✅ Login successful\n');

        // 3. Test user data
        console.log('3. Testing user data endpoint...');
        const userData = await axios.get(`${API_URL}/users/${login.data.user.id}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('User data:', userData.data);
        console.log('✅ User data endpoint passed\n');

        // 4. Test devices endpoint
        console.log('4. Testing devices endpoint...');
        const devices = await axios.get(`${API_URL}/devices`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('Devices:', devices.data);
        console.log('✅ Devices endpoint passed\n');

        // 5. Test transactions endpoint
        console.log('5. Testing transactions endpoint...');
        const transactions = await axios.get(`${API_URL}/transactions`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('Transactions:', transactions.data);
        console.log('✅ Transactions endpoint passed\n');

        console.log('🎉 All tests passed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

// Run tests
testAPI(); 