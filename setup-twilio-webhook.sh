#!/bin/bash
set -e

# Define variables
SERVER_IP="13.219.30.68"  # Your server IP
BACKEND_PORT=5000          # The port your backend is running on
WEBHOOK_PATH="/api/webhook/twilio"  # Your webhook path

# Display information
echo "Setting up Twilio webhook for WhatsApp integration"
echo "=================================================="
echo "Server IP: $SERVER_IP"
echo "Backend Port: $BACKEND_PORT"
echo "Webhook Path: $WEBHOOK_PATH"
echo ""

# Full webhook URL
WEBHOOK_URL="http://$SERVER_IP:$BACKEND_PORT$WEBHOOK_PATH"
echo "Your Twilio webhook URL is: $WEBHOOK_URL"
echo ""

# Instructions for Twilio configuration
echo "Follow these steps to configure Twilio:"
echo "1. Log in to your Twilio account at https://www.twilio.com/console"
echo "2. Navigate to Messaging > Settings > WhatsApp Sandbox Settings"
echo "3. Set the 'WHEN A MESSAGE COMES IN' field to: $WEBHOOK_URL"
echo "4. Make sure your backend server is running and accessible from the internet"
echo "5. Ensure port $BACKEND_PORT is open in your server's firewall/security group"
echo ""

# Check if the backend is running
echo "Checking if your backend is accessible..."
if curl -s "$WEBHOOK_URL" > /dev/null; then
  echo "✅ Backend is accessible at $WEBHOOK_URL"
else
  echo "❌ Backend is not accessible at $WEBHOOK_URL"
  echo "Please check that:"
  echo "  - Your backend server is running"
  echo "  - Port $BACKEND_PORT is open in your firewall/security group"
  echo "  - Your server IP is correct"
fi
echo ""

# Instructions for testing
echo "To test your webhook:"
echo "1. Send a message to your Twilio WhatsApp number"
echo "2. Check your backend logs for incoming webhook requests"
echo "   docker logs whatsy-backend"
echo ""

echo "For more information, visit: https://www.twilio.com/docs/whatsapp/api"
