#!/bin/bash
set -e

echo "Running Whatsy App Locally with Docker Compose"
echo "=============================================="

# Create SSL certificates directory if it doesn't exist
mkdir -p ./backend/certs

# Generate self-signed certificates if they don't exist
if [ ! -f ./backend/certs/cert.pem ] || [ ! -f ./backend/certs/key.pem ]; then
  echo "Generating self-signed SSL certificates..."
  openssl req -x509 -newkey rsa:4096 -keyout ./backend/certs/key.pem -out ./backend/certs/cert.pem -days 365 -nodes -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,DNS:whatsy-backend,IP:127.0.0.1"
  chmod 600 ./backend/certs/key.pem
  chmod 644 ./backend/certs/cert.pem
  echo "SSL certificates generated successfully!"
fi

# Create .env file for backend if it doesn't exist
if [ ! -f ./backend/.env ]; then
  echo "Creating backend .env file..."
  cat > ./backend/.env << EOL
# OpenAI Configuration
OPENAI_API_KEY=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

# Firebase Configuration
FIREBASE_API_KEY=AIzaSyDsftA3WWt0RFn0MDB6g6FYrvTt3ZAAS-Y
FIREBASE_AUTH_DOMAIN=botapp-898bd.firebaseapp.com
FIREBASE_PROJECT_ID=botapp-898bd
FIREBASE_STORAGE_BUCKET=botapp-898bd.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=923990411283
FIREBASE_APP_ID=1:923990411283:web:9fcfba22775ef20d3ad7e6

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACc51b1aea3e74f0c2cb89fcb4de030416
TWILIO_AUTH_TOKEN=3d3f301094a44e2fc5a014ba709e2386
WHATSAPP_PHONE_NUMBER=14155238886

# Server Configuration
PORT=5001
NODE_ENV=development
SKIP_TWILIO_VALIDATION=true

# HTTPS Configuration
ENABLE_HTTPS=true
SSL_CERT_PATH=./certs/cert.pem
SSL_KEY_PATH=./certs/key.pem
HTTPS_PORT=444
EOL
  echo "Backend .env file created!"
fi

# Stop and remove existing containers
echo "Stopping and removing existing containers if they exist..."
docker-compose -f docker-compose.local.yml down

# Pull latest images
echo "Pulling latest Docker images..."
docker-compose -f docker-compose.local.yml pull

# Start containers
echo "Starting containers..."
docker-compose -f docker-compose.local.yml up -d

echo ""
echo "Containers started successfully!"
echo "Frontend is available at: http://localhost:3000"
echo "Backend is available at: http://localhost:5001"
echo "Backend with HTTPS is available at: https://localhost:444"
echo ""
echo "To check the logs:"
echo "docker logs whatsy-backend  # For backend logs"
echo "docker logs whatsy-frontend  # For frontend logs"
echo ""
echo "To stop the containers:"
echo "docker-compose -f docker-compose.local.yml down"
