import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

async function testSms() {
  const username = process.env.KUDISMS_USERNAME;
  const password = process.env.KUDISMS_PASSWORD;
  const senderId = process.env.KUDISMS_SENDER_ID;
  const baseUrl = 'https://account.kudisms.net/api/';

  console.log('Testing KudiSMS with:', { username, hasPassword: !!password, senderId });

  if (!username) {
    console.log('KUDISMS_USERNAME is not set in .env');
  }

  const params = new URLSearchParams();
  params.append('username', username || '');
  params.append('password', password || '');
  params.append('message', 'Test message from KudiSMS Integration');
  params.append('sender', senderId || 'N-Alert');
  params.append('mobiles', '2348000000000'); // testing purpose

  try {
    console.log('Sending payload via GET query parameters...');
    const urlWithParams = `${baseUrl}?${params.toString()}`;
    const response = await axios.get(urlWithParams);

    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
  } catch (err: any) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
  }
}

testSms();
