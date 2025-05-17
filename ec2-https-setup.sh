#!/bin/bash
set -e

echo "Setting up HTTPS for your backend on EC2"
echo "========================================"

# Create directory for certificates
mkdir -p ~/certs

# Generate self-signed certificates
echo "Generating self-signed SSL certificates..."
openssl req -x509 -newkey rsa:4096 -keyout ~/certs/key.pem -out ~/certs/cert.pem -days 365 -nodes -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,DNS:whatsy-backend,IP:127.0.0.1,IP:13.219.30.68"

# Set appropriate permissions
chmod 600 ~/certs/key.pem
chmod 644 ~/certs/cert.pem

echo "SSL certificates generated successfully!"

# Update environment variables
echo "Updating environment variables..."
if [ -f ~/.env ]; then
  # Check if HTTPS variables already exist
  if grep -q "ENABLE_HTTPS" ~/.env; then
    echo "HTTPS variables already exist in .env file"
  else
    # Add HTTPS variables to .env file
    echo "" >> ~/.env
    echo "# HTTPS Configuration" >> ~/.env
    echo "ENABLE_HTTPS=true" >> ~/.env
    echo "SSL_CERT_PATH=./certs/cert.pem" >> ~/.env
    echo "SSL_KEY_PATH=./certs/key.pem" >> ~/.env
    echo "HTTPS_PORT=443" >> ~/.env
    echo "Added HTTPS variables to .env file"
  fi
else
  echo "Warning: .env file not found. Please add the following variables manually:"
  echo "ENABLE_HTTPS=true"
  echo "SSL_CERT_PATH=./certs/cert.pem"
  echo "SSL_KEY_PATH=./certs/key.pem"
  echo "HTTPS_PORT=443"
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "Error: Docker is not installed. Please install Docker first."
  exit 1
fi

# Stop and remove existing container if it exists
echo "Stopping and removing existing container if it exists..."
docker stop whatsy-backend 2>/dev/null || true
docker rm whatsy-backend 2>/dev/null || true

# Pull the latest image
echo "Pulling the latest backend image..."
docker pull edensit139/whatsy:backend-prod

# Create Docker network if it doesn't exist
echo "Creating Docker network if it doesn't exist..."
docker network inspect whatsy-network >/dev/null 2>&1 || docker network create whatsy-network

# Run the container with HTTPS support
echo "Starting the backend container with HTTPS support..."
docker run -d \
  --name whatsy-backend \
  --network whatsy-network \
  --dns 8.8.8.8 --dns 8.8.4.4 \
  -p 5000:5000 \
  -p 443:443 \
  -v ~/certs:/app/certs \
  --env-file ~/.env \
  --restart unless-stopped \
  edensit139/whatsy:backend-prod

echo ""
echo "Backend container started with HTTPS support!"
echo "Your Twilio webhook URL is: https://13.219.30.68/api/webhook/twilio"
echo ""
echo "To configure Twilio:"
echo "1. Log in to your Twilio account at https://www.twilio.com/console"
echo "2. Navigate to Messaging > Settings > WhatsApp Sandbox Settings"
echo "3. Set the 'WHEN A MESSAGE COMES IN' field to: https://13.219.30.68/api/webhook/twilio"
echo "4. Click Save"
echo ""
echo "To check the logs:"
echo "docker logs whatsy-backend"
