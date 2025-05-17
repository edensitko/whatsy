import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testTwilioWebhook() {
  console.log('Testing Twilio webhook configuration...');
  
  // Prompt for webhook URL
  rl.question('Enter your ngrok URL (e.g., https://abc123.ngrok.io): ', async (webhookBaseUrl) => {
    if (!webhookBaseUrl) {
      console.log('❌ No URL provided. Test aborted.');
      rl.close();
      return;
    }
    
    // Normalize the URL
    const baseUrl = webhookBaseUrl.endsWith('/') ? webhookBaseUrl.slice(0, -1) : webhookBaseUrl;
    
    // Test verification endpoint first
    try {
      console.log(`Testing verification endpoint: ${baseUrl}/api/whatsapp/verify`);
      const verifyResponse = await axios.get(`${baseUrl}/api/whatsapp/verify`);
      console.log('✅ Verification endpoint accessible:', verifyResponse.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('❌ Error accessing verification endpoint:', axiosError.message);
      if (axiosError.response) {
        console.log('Response status:', axiosError.response.status);
        console.log('Response data:', axiosError.response.data);
      }
    }
    
    // Test webhook with a simulated Twilio message
    try {
      console.log(`\nTesting webhook endpoint: ${baseUrl}/api/whatsapp/webhook`);
      
      // Simulate a Twilio WhatsApp message
      const twilioPayload = {
        Body: 'botId=e1b2c3 Test message',
        From: 'whatsapp:+12345678901',
        To: 'whatsapp:+14155238886',
        SmsMessageSid: 'SM' + Math.random().toString(36).substring(2, 15),
        NumMedia: '0',
        ProfileName: 'Test User',
        WaId: '12345678901',
        SmsStatus: 'received'
      };
      
      console.log('Sending simulated Twilio payload:', JSON.stringify(twilioPayload, null, 2));
      
      const webhookResponse = await axios.post(
        `${baseUrl}/api/whatsapp/webhook`,
        twilioPayload,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      console.log('✅ Webhook response:', webhookResponse.status, webhookResponse.data);
      console.log('\nIf you see a 200 OK response, your webhook is properly configured!');
      console.log('Check your server logs for the processed message details.');
      
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('❌ Error testing webhook:', axiosError.message);
      if (axiosError.response) {
        console.log('Response status:', axiosError.response.status);
        console.log('Response data:', axiosError.response.data);
      }
      
      console.log('\nPossible issues:');
      console.log('1. Your server is not running');
      console.log('2. Your ngrok tunnel is not active or the URL is incorrect');
      console.log('3. There\'s an error in your webhook handler');
    } finally {
      rl.close();
    }
  });
}

// Run the test
testTwilioWebhook();
