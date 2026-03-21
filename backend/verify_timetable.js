const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3000/api/v1';

async function verify() {
  try {
    console.log('🔐 Logging in as admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@sms.school',
      password: 'Admin@12345'
    });

    const token = loginRes.data.data?.access_token;
    
    if (!token) {
        console.error('❌ No token found in response!', loginRes.data);
        return;
    }
    
    console.log('✅ Login successful!');

    const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 1. Check Timetable Periods
    console.log('🔍 Checking /academics/timetable/periods...');
    const periodsRes = await axios.get(`${API_URL}/academics/timetable/periods`, { headers });
    const periods = periodsRes.data.data || [];
    console.log(`✅ Periods: ${periods.length} found`);
    
    // 2. Try to initialize if 0 found
    if (periods.length === 0) {
        console.log('🔄 Initializing default periods...');
        const initRes = await axios.get(`${API_URL}/academics/timetable/periods/initialize`, { headers });
        const initializedPeriods = initRes.data.data || [];
        console.log(`✅ Initialized: ${initializedPeriods.length} periods created`);
    }

    console.log('\n🌟 TIMETABLE CHECK PASSED!');

  } catch (err) {
    console.error('❌ Verification failed:');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}

verify();
