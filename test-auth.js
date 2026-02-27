const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';
let testsPassed = 0;
let testsFailed = 0;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAuthFlow() {
  console.log('🧪 Testing Auth Flow with Refresh Token...\n');

  try {
    // Wait for server to be ready
    console.log('⏳ Waiting for server to be ready...');
    await delay(3000);

    // Test 1: Login
    console.log('\n1️⃣  Testing Login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'sarah@gmail.com',
      password: 'password123',
    });

    const { access_token, refresh_token, user } = loginResponse.data;

    if (access_token && refresh_token) {
      console.log('✅ Login successful');
      console.log(`   - Access Token: ${access_token.substring(0, 20)}...`);
      console.log(`   - Refresh Token: ${refresh_token.substring(0, 20)}...`);
      console.log(`   - User: ${user.email}`);
      testsPassed++;
    } else {
      console.log('❌ Login failed - no tokens returned');
      testsFailed++;
      return;
    }

    // Test 2: Refresh Token
    console.log('\n2️⃣  Testing Refresh Token...');
    const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
      refresh_token,
    });

    const { access_token: newAccessToken, refresh_token: newRefreshToken } =
      refreshResponse.data;

    if (newAccessToken && newRefreshToken) {
      console.log('✅ Token refresh successful');
      console.log(`   - New Access Token: ${newAccessToken.substring(0, 20)}...`);
      console.log(`   - New Refresh Token: ${newRefreshToken.substring(0, 20)}...`);
      testsPassed++;
    } else {
      console.log('❌ Token refresh failed');
      testsFailed++;
      return;
    }

    // Test 3: Use new access token
    console.log('\n3️⃣  Testing API request with new Access Token...');
    const apiResponse = await axios.get(`${API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${newAccessToken}`,
      },
    });

    console.log('✅ API request with new token successful');
    testsPassed++;

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results:');
    console.log(`   ✅ Passed: ${testsPassed}`);
    console.log(`   ❌ Failed: ${testsFailed}`);
    console.log('='.repeat(50));

    process.exit(testsFailed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    testsFailed++;
    console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);
    process.exit(1);
  }
}

testAuthFlow();
