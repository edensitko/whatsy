#!/bin/bash
set -e

echo "Deploying WhatsApp Interactive Features"
echo "======================================="

# Pull the latest image
echo "Pulling the latest Docker image..."
docker pull edensit139/whatsy:backend-prod-interactive

# Stop and remove existing container
echo "Stopping and removing existing container..."
docker stop whatsy-backend 2>/dev/null || true
docker rm whatsy-backend 2>/dev/null || true

# Create Docker network if it doesn't exist
echo "Creating Docker network if it doesn't exist..."
docker network inspect whatsy-network >/dev/null 2>&1 || docker network create whatsy-network

# Run the container with HTTPS support
echo "Starting the backend container with HTTPS and interactive WhatsApp support..."
docker run -d \
  --name whatsy-backend \
  --network whatsy-network \
  --dns 8.8.8.8 --dns 8.8.4.4 \
  -p 5000:5000 \
  -p 443:443 \
  -v ~/certs:/app/certs \
  --env-file ~/.env \
  --restart unless-stopped \
  edensit139/whatsy:backend-prod-interactive

echo ""
echo "WhatsApp interactive features deployed successfully!"
echo "Your Twilio webhook URL is: https://$HOSTNAME/api/webhook/twilio"
echo ""
echo "To check the logs:"
echo "docker logs whatsy-backend"
