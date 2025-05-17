# Smart Biz ChatFlow - WhatsApp Integration Server

This server provides the backend functionality for integrating the Smart Biz ChatFlow application with WhatsApp.

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Twilio account with WhatsApp capabilities
- OpenAI API key

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Twilio credentials and WhatsApp phone number
   ```
   PORT=3000
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   WHATSAPP_PHONE_NUMBER=your_whatsapp_number
   ```

3. Build the server:
   ```
   npm run build
   ```

4. Start the server:
   ```
   npm start
   ```

## API Endpoints

### WhatsApp Endpoints

- `POST /api/whatsapp/webhook` - Webhook for incoming WhatsApp messages
- `POST /api/whatsapp/send` - Send a WhatsApp message manually

### Business Endpoints

- `GET /api/business/:id` - Get business by ID
- `GET /api/business/bot/:botId` - Get business by bot ID
- `POST /api/business` - Create a new business
- `PUT /api/business/:id` - Update an existing business

## Twilio WhatsApp Setup

1. Sign up for a Twilio account at [twilio.com](https://www.twilio.com)
2. Navigate to the WhatsApp section in the Twilio console
3. Set up a WhatsApp Sandbox
4. Configure the webhook URL to point to your server's `/api/whatsapp/webhook` endpoint

## Production Deployment

For production deployment, consider:

1. Using a database instead of in-memory storage
2. Implementing proper authentication and security measures
3. Setting up a production-grade hosting environment (AWS, Google Cloud, etc.)
4. Implementing message queuing for high volume
