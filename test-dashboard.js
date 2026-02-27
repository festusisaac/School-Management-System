
const axios = require('axios');

const API_URL = 'http://localhost:3002/api/v1'; // Using port 3002 as per previous investigation

async function testDashboardEndpoints() {
    console.log('🧪 Testing Dashboard Endpoints...\n');

    try {
        // Step 1: Login to get token
        const uniqueEmail = 'admin_test_1765839075701@sms.school'; // Using the user we know exists
        const password = 'TestAdmin@123';

        console.log('1️⃣  Logging in...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: uniqueEmail,
            password: password,
        });
        const { access_token } = loginResponse.data.data;
        const config = { headers: { Authorization: `Bearer ${access_token}` } };
        console.log('✅ Logged in');

        // Step 2: Test Stats
        console.log('\n2️⃣  Testing /reporting/dashboard/admin/stats ...');
        try {
            const stats = await axios.get(`${API_URL}/reporting/dashboard/admin/stats`, config);
            console.log('✅ Stats Data:', JSON.stringify(stats.data, null, 2));
        } catch (err) {
            console.error('❌ Stats Failed:', err.message);
            if (err.response) console.error(err.response.data);
        }

        // Step 3: Test Activities
        console.log('\n3️⃣  Testing /reporting/dashboard/admin/activities ...');
        try {
            const activities = await axios.get(`${API_URL}/reporting/dashboard/admin/activities`, config);
            console.log('✅ Activities Data:', JSON.stringify(activities.data, null, 2));
        } catch (err) {
            console.error('❌ Activities Failed:', err.message);
            if (err.response) console.error(err.response.data);
        }

        // Step 4: Test Charts
        console.log('\n4️⃣  Testing /reporting/dashboard/admin/charts ...');
        try {
            const charts = await axios.get(`${API_URL}/reporting/dashboard/admin/charts`, config);
            console.log('✅ Charts Data:', JSON.stringify(charts.data, null, 2));
        } catch (err) {
            console.error('❌ Charts Failed:', err.message);
            if (err.response) console.error(err.response.data);
        }

    } catch (error) {
        console.error('❌ Login Failed:', error.message);
    }
}

testDashboardEndpoints();
