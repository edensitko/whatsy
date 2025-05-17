import { getOpenAIResponse } from './services/openaiService';
import { getBusinessById, getAllBusinesses } from './services/businessService';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testChatGPT() {
  console.log('Testing ChatGPT integration...');
  console.log('Environment variables:');
  console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✓ Set' : '✗ Not set'}`);
  
  // Get all businesses and use the first one
  const businesses = await getAllBusinesses();
  
  if (!businesses || businesses.length === 0) {
    console.error('❌ No businesses found. Please check the businessService.');
    rl.close();
    return;
  }
  
  // Use the first business for testing
  const business = businesses[0];
  
  console.log(`✓ Found business: ${business.name}`);
  console.log(`✓ Business prompt template is ${business.prompt_template.length} characters long`);
  
  // Prompt for test message
  rl.question('Enter a message to test ChatGPT (or press Enter to use a default message): ', async (userMessage) => {
    // Use default message if none provided
    const message = userMessage || 'שלום, מה שעות הפעילות שלכם?';
    
    console.log(`Testing with message: "${message}"`);
    
    try {
      console.log('Sending request to OpenAI...');
      const response = await getOpenAIResponse(
        process.env.OPENAI_API_KEY || '',
        business.prompt_template,
        message,
        business
      );
      
      console.log('\n✅ ChatGPT Response:');
      console.log('------------------------');
      console.log(response.content);
      console.log('------------------------');
      
      // Check if the response contains the business name
      if (response.content.includes(business.name)) {
        console.log('✓ Response contains the business name');
      } else {
        console.log('⚠️ Response does not contain the business name');
      }
      
      // Check if the response contains hours information
      if (response.content.toLowerCase().includes('hour') || response.content.includes('שעות')) {
        console.log('✓ Response contains hours information');
      } else {
        console.log('⚠️ Response does not contain hours information');
      }
    } catch (error) {
      console.error('❌ Error getting response from OpenAI:', error);
    }
    
    rl.close();
  });
}

// Run the test
testChatGPT();
