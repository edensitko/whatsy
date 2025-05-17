#!/bin/bash
set -e

echo "Deploying WhatsApp Interactive Features to EC2"
echo "=============================================="

# EC2 connection details
EC2_HOST="13.219.30.68"
EC2_USER="ubuntu"
KEY_PATH="$HOME/Downloads/mymymymy.pem"

# Create deployment script
cat > deploy-script.sh << 'EOL'
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
EOL

# Make the script executable
chmod +x deploy-script.sh

# Copy the script to EC2
echo "Copying deployment script to EC2..."
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no deploy-script.sh $EC2_USER@$EC2_HOST:~/

# Run the script on EC2
echo "Running deployment script on EC2..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST "chmod +x ~/deploy-script.sh && ~/deploy-script.sh"

# Clean up local script
rm deploy-script.sh

echo ""
echo "Deployment completed!"
echo "Your WhatsApp backend with interactive features is now running on EC2."
echo "Twilio webhook URL: https://$EC2_HOST/api/webhook/twilio"
