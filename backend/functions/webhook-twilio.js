const { processWhatsAppWebhook } = require('../dist/routes/whatsapp');

exports.handler = async function(event, context) {
  // Log the request
  console.log('Received webhook request:', event.body);
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }
  
  try {
    // Parse the request body
    const body = JSON.parse(event.body);
    
    // Process the webhook
    await processWhatsAppWebhook(body);
    
    // Return success
    return {
      statusCode: 200,
      body: 'Message processed'
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return {
      statusCode: 500,
      body: 'Internal Server Error'
    };
  }
};
