import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const apiKey = process.env.TERMII_API_KEY;
const senderId = process.env.TERMII_SENDER_ID || 'SMS-SCHOOL';
const baseUrl = process.env.TERMII_BASE_URL || 'https://api.termii.com/api';
const channel = process.env.TERMII_CHANNEL || 'generic';

// Use phone number from command line argument or default placeholder
const testPhoneNumber = process.argv[2] || '2347041363484'; 

async function testTermii() {
  console.log('--- Termii SMS Test ---');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Sender ID: ${senderId}`);
  console.log(`Channel: ${channel}`);
  
  if (!apiKey) {
    console.error('Error: TERMII_API_KEY is not set in .env');
    return;
  }

  // Format phone number
  let formattedTo = testPhoneNumber.replace(/\D/g, '');
  if (formattedTo.startsWith('0')) {
    formattedTo = '234' + formattedTo.substring(1);
  } else if (!formattedTo.startsWith('234')) {
    formattedTo = '234' + formattedTo;
  }

  console.log(`Target Number: ${formattedTo}`);

  const payload = {
    api_key: apiKey,
    to: [formattedTo],
    from: senderId,
    sms: 'Hello! This is a test message from your School Management System via Termii.',
    type: 'plain',
    channel: channel,
  };

  try {
    const response = await axios.post(`${baseUrl}/api/sms/send`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Success!');
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('Failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

testTermii();
