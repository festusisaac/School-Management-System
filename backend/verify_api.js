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

    // 1. Check Classes
    console.log('🔍 Checking /academics/classes...');
    const classesRes = await axios.get(`${API_URL}/academics/classes`, { headers });
    console.log(`✅ Classes: ${classesRes.data.data ? classesRes.data.data.length : classesRes.data.length} found`);

    // 2. Check Staff
    console.log('🔍 Checking /hr/staff...');
    const staffRes = await axios.get(`${API_URL}/hr/staff`, { headers });
    console.log(`✅ Staff: ${staffRes.data.data ? staffRes.data.data.length : staffRes.data.length} found`);

    console.log('\n🌟 ALL CHECKS PASSED!');

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
