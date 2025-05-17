import { sendWhatsAppMessage } from './services/whatsappService';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testTwilioWhatsApp() {
  console.log('Starting Twilio WhatsApp test...');
  console.log('Environment variables:');
  console.log(`TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? '✓ Set' : '✗ Not set'}`);
  console.log(`TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? '✓ Set' : '✗ Not set'}`);
  console.log(`WHATSAPP_PHONE_NUMBER: ${process.env.WHATSAPP_PHONE_NUMBER ? process.env.WHATSAPP_PHONE_NUMBER : '✗ Not set'}`);
  
  // Prompt for test phone number
  rl.question('Enter a WhatsApp-enabled phone number to test (format: 1234567890, no + or spaces): ', async (testPhoneNumber) => {
    if (!testPhoneNumber) {
      console.log('❌ No phone number provided. Test aborted.');
      rl.close();
      return;
    }
    
    // Test message
    const testMessage = 'This is a test message from your WhatsApp bot. If you receive this, Twilio is working correctly!';
    
    console.log(`Attempting to send message to: ${testPhoneNumber}`);
    
    try {
      const result = await sendWhatsAppMessage(testPhoneNumber, testMessage);
      
      if (result) {
        console.log('✅ Test successful! Message was sent or would have been sent in mock mode.');
      } else {
        console.log('❌ Test failed. Message could not be sent.');
      }
    } catch (error) {
      console.error('❌ Test error:', error);
    } finally {
      rl.close();
    }
  });
}

// Run the test
testTwilioWhatsApp();
