#!/bin/bash

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "Error: ngrok is not installed. Please install it first."
    exit 1
fi

# Configure ngrok with auth token
echo "Configuring ngrok with auth token..."
ngrok authtoken 2wgrNwx5QETTYOiToiNyMjqWRde_6WP8Defk826n984E3M2iL

# Start the server in the background
echo "Starting the server..."
cd "$(dirname "$0")/backend" && npm run dev &
SERVER_PID=$!

# Wait for the server to start
echo "Waiting for server to start..."
sleep 5

# Start ngrok
echo "Starting ngrok tunnel to port 3000..."
echo "IMPORTANT: Copy the HTTPS URL from ngrok and configure it in Twilio's WhatsApp Sandbox settings."
echo "Set the webhook URL to: YOUR_NGROK_URL/api/whatsapp/webhook"
echo "Make sure to select HTTP POST as the request method."
echo ""
echo "To test your webhook, run: cd backend && npx ts-node src/test-twilio-webhook.ts"
echo ""

# Start ngrok in the foreground
ngrok http 3000

# When ngrok is closed, also stop the server
kill $SERVER_PID
echo "Server stopped."
