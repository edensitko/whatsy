#!/bin/bash
set -e

echo "Running Whatsy App Locally from Docker Hub"
echo "=========================================="

# Variables
BACKEND_IMAGE="edensit139/whatsy:backend-prod"
FRONTEND_IMAGE="edensit139/whatsy:frontend-prod"
BACKEND_CONTAINER="whatsy-backend-local"
FRONTEND_CONTAINER="whatsy-frontend-local"
NETWORK_NAME="whatsy-network-local"
BACKEND_PORT="5001"  # Changed from 5000 to avoid conflicts
HTTPS_PORT="444"     # Changed from 443 to avoid conflicts
FRONTEND_PORT="3000"

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
PORT=$BACKEND_PORT
NODE_ENV=development
SKIP_TWILIO_VALIDATION=true

# HTTPS Configuration
ENABLE_HTTPS=true
SSL_CERT_PATH=./certs/cert.pem
SSL_KEY_PATH=./certs/key.pem
HTTPS_PORT=$HTTPS_PORT
EOL
  echo "Backend .env file created!"
fi

# Stop and remove existing containers if they exist
echo "Stopping and removing existing containers if they exist..."
docker stop $BACKEND_CONTAINER 2>/dev/null || true
docker rm $BACKEND_CONTAINER 2>/dev/null || true
docker stop $FRONTEND_CONTAINER 2>/dev/null || true
docker rm $FRONTEND_CONTAINER 2>/dev/null || true

# Create Docker network if it doesn't exist
echo "Creating Docker network if it doesn't exist..."
docker network inspect $NETWORK_NAME >/dev/null 2>&1 || docker network create $NETWORK_NAME

# Pull the latest images
echo "Pulling the latest Docker images..."
docker pull $BACKEND_IMAGE
docker pull $FRONTEND_IMAGE

# Run the backend container
echo "Starting the backend container..."
docker run -d \
  --name $BACKEND_CONTAINER \
  --network $NETWORK_NAME \
  --dns 8.8.8.8 --dns 8.8.4.4 \
  -p $BACKEND_PORT:$BACKEND_PORT \
  -p $HTTPS_PORT:$HTTPS_PORT \
  -v "$(pwd)/backend/certs:/app/certs" \
  -v "$(pwd)/backend/.env:/app/.env" \
  --restart unless-stopped \
  $BACKEND_IMAGE

# Run the frontend container
echo "Starting the frontend container..."
docker run -d \
  --name $FRONTEND_CONTAINER \
  --network $NETWORK_NAME \
  --dns 8.8.8.8 --dns 8.8.4.4 \
  -p $FRONTEND_PORT:80 \
  --restart unless-stopped \
  $FRONTEND_IMAGE

echo ""
echo "Containers started successfully!"
echo "Frontend is available at: http://localhost:$FRONTEND_PORT"
echo "Backend is available at: http://localhost:$BACKEND_PORT"
echo "Backend with HTTPS is available at: https://localhost:$HTTPS_PORT"
echo ""
echo "To check the logs:"
echo "docker logs $BACKEND_CONTAINER  # For backend logs"
echo "docker logs $FRONTEND_CONTAINER  # For frontend logs"
