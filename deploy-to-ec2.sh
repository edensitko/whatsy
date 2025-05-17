#!/bin/bash
set -e

echo "Deploying WhatsApp Interactive Features to EC2"
echo "=============================================="

# EC2 connection details
EC2_HOST="13.219.30.68"
EC2_USER="ubuntu"
KEY_PATH="/Users/edensitkovetsky/Downloads/mymymymy.pem"

# Create a zip file of the deployment files
echo "Creating deployment package..."
cd deploy-files
zip -r ../whatsapp-interactive-update.zip ./*
cd ..

# Copy the zip file to EC2
echo "Copying files to EC2..."
scp -i "/Users/edensitkovetsky/Downloads/mymymymy.pem" -o StrictHostKeyChecking=no whatsapp-interactive-update.zip ubuntu@13.219.30.68:~/

# Extract and run the update script on EC2
echo "Running update on EC2..."
ssh -i "/Users/edensitkovetsky/Downloads/mymymymy.pem" -o StrictHostKeyChecking=no ubuntu@13.219.30.68 << 'ENDSSH'
mkdir -p whatsapp-update
unzip -o whatsapp-interactive-update.zip -d whatsapp-update
cd whatsapp-update
chmod +x update-backend.sh
./update-backend.sh
ENDSSH

# Clean up local files
echo "Cleaning up local files..."
rm -rf deploy-files
rm whatsapp-interactive-update.zip

echo ""
echo "Deployment completed!"
echo "Your WhatsApp backend with interactive features is now running on EC2."
echo "Twilio webhook URL: https://13.219.30.68/api/webhook/twilio"
