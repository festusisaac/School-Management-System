const { Resend } = require('resend');
require('dotenv').config();

async function testResend() {
  console.log('--- Resend Verification Script ---');
  
  const apiKey = process.env.RESEND_API_KEY;
  const fromDomain = process.env.RESEND_FROM;
  
  if (!apiKey) {
    console.error('Error: RESEND_API_KEY is not defined in .env');
    process.exit(1);
  }

  // Handle cases where RESEND_FROM is just a domain or a full email
  const fromEmail = fromDomain.includes('@') 
    ? fromDomain 
    : `test@${fromDomain}`;

  console.log(`Using API Key: ${apiKey.substring(0, 7)}...`);
  console.log(`Sending from: ${fromEmail}`);

  const resend = new Resend(apiKey);

  try {
    console.log('Attempting to send test email...');
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: ['festusisaac848@gmail.com'], // Using a common service email or the user can change it
      subject: 'Resend Integration Test - SMS',
      html: `
        <h1>Integration Successful!</h1>
        <p>Your School Management System is now successfully connected to Resend.</p>
        <p><b>Configuration:</b></p>
        <ul>
          <li>Provider: Resend SDK</li>
          <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
          <li>Timestamp: ${new Date().toLocaleString()}</li>
        </ul>
      `,
    });

    if (error) {
      console.error('Resend API Error:', error);
      if (error.name === 'validation_error') {
        console.log('\nTip: Make sure the "from" address domain is verified in your Resend dashboard.');
      }
    } else {
      console.log('\nSuccess! Email dispatched successfully.');
      console.log('Message ID:', data.id);
      console.log('\nPlease check your inbox (and spam folder) at festusisaac60@gmail.com');
    }
  } catch (err) {
    console.error('Unexpected Error:', err.message);
  }
}

testResend();
