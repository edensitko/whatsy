#!/bin/bash
set -e

echo "Fetching latest Docker image and running container"
echo "================================================="

# Variables
IMAGE_NAME="edensit139/whatsy:backend-prod"
CONTAINER_NAME="whatsy-backend"
NETWORK_NAME="whatsy-network"
PORT_HTTP="5000"
PORT_HTTPS="443"
ENV_FILE="~/.env"
CERTS_DIR="~/certs"

# SSH command to run on EC2
SSH_COMMAND="
# Pull the latest image
echo 'Pulling the latest Docker image...'
docker pull $IMAGE_NAME

# Stop and remove existing container if it exists
echo 'Stopping and removing existing container if it exists...'
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Create Docker network if it doesn't exist
echo 'Creating Docker network if it doesn't exist...'
docker network inspect $NETWORK_NAME >/dev/null 2>&1 || docker network create $NETWORK_NAME

# Run the container with HTTPS support
echo 'Starting the backend container...'
docker run -d \\
  --name $CONTAINER_NAME \\
  --network $NETWORK_NAME \\
  --dns 8.8.8.8 --dns 8.8.4.4 \\
  -p $PORT_HTTP:$PORT_HTTP \\
  -p $PORT_HTTPS:$PORT_HTTPS \\
  -v $CERTS_DIR:/app/certs \\
  --env-file $ENV_FILE \\
  --restart unless-stopped \\
  $IMAGE_NAME

echo ''
echo 'Container started successfully!'
echo 'To check the logs:'
echo 'docker logs $CONTAINER_NAME'
"

# Run the command on EC2
echo "To run this on your EC2 instance, SSH into it and run the following commands:"
echo "--------------------------------------------------------------------"
echo "$SSH_COMMAND"
echo "--------------------------------------------------------------------"
echo ""
echo "Or you can copy and paste this one-liner to execute it remotely:"
echo "ssh -i ~/Downloads/mymymymy.pem ubuntu@13.219.30.68 \"$SSH_COMMAND\""
