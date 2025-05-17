#!/bin/bash
set -e

# This script sets up Jenkins on an EC2 instance for Whatsy app deployment
# Usage: ./setup-jenkins-ec2.sh <EC2_HOST> <SSH_KEY_PATH>

# Check if arguments are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <EC2_HOST> <SSH_KEY_PATH>"
    echo "Example: $0 13.219.30.68 ~/Downloads/mymymymy.pem"
    exit 1
fi

EC2_HOST=$1
SSH_KEY_PATH=$2
EC2_USER="ubuntu"

echo "Setting up Jenkins on EC2 instance: $EC2_HOST"
echo "================================================="

# SSH command function
ssh_command() {
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "$1"
}

# Step 1: Update system packages
echo "Updating system packages..."
ssh_command "sudo apt update && sudo apt upgrade -y"

# Step 2: Install Java
echo "Installing Java..."
ssh_command "sudo apt install -y openjdk-11-jdk"

# Step 3: Install Jenkins
echo "Installing Jenkins..."
ssh_command "curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null"
ssh_command 'echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null'
ssh_command "sudo apt update && sudo apt install -y jenkins"

# Step 4: Start Jenkins service
echo "Starting Jenkins service..."
ssh_command "sudo systemctl enable jenkins && sudo systemctl start jenkins"

# Step 5: Configure firewall
echo "Configuring firewall..."
ssh_command "sudo ufw allow 8080 && sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw allow 3000 && sudo ufw allow 5000"
ssh_command "sudo ufw --force enable"

# Step 6: Install Docker
echo "Installing Docker..."
ssh_command "sudo apt install -y apt-transport-https ca-certificates curl software-properties-common"
ssh_command "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -"
ssh_command 'sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"'
ssh_command "sudo apt update && sudo apt install -y docker-ce"

# Step 7: Add jenkins user to docker group
echo "Adding jenkins user to docker group..."
ssh_command "sudo usermod -aG docker jenkins"
ssh_command "sudo chmod 666 /var/run/docker.sock"
ssh_command "sudo systemctl restart jenkins"

# Step 8: Create SSL certificates directory
echo "Creating SSL certificates directory..."
ssh_command "mkdir -p ~/certs"

# Step 9: Generate self-signed SSL certificates
echo "Generating self-signed SSL certificates..."
ssh_command "openssl req -x509 -newkey rsa:4096 -keyout ~/certs/key.pem -out ~/certs/cert.pem -days 365 -nodes -subj \"/CN=localhost\" -addext \"subjectAltName=DNS:localhost,DNS:whatsy-backend,IP:127.0.0.1,IP:$EC2_HOST\""
ssh_command "chmod 600 ~/certs/key.pem && chmod 644 ~/certs/cert.pem"

# Step 10: Create environment file
echo "Creating environment file..."
ssh_command "cat > ~/.env << 'EOL'
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
PORT=5000
NODE_ENV=production

# HTTPS Configuration
ENABLE_HTTPS=true
SSL_CERT_PATH=./certs/cert.pem
SSL_KEY_PATH=./certs/key.pem
HTTPS_PORT=443
EOL"

# Step 11: Create Docker network
echo "Creating Docker network..."
ssh_command "docker network create whatsy-network || true"

# Step 12: Set permissions for Jenkins
echo "Setting permissions for Jenkins..."
ssh_command "sudo chown -R jenkins:jenkins ~/certs"

# Step 13: Get Jenkins initial admin password
echo "Getting Jenkins initial admin password..."
JENKINS_PASSWORD=$(ssh_command "sudo cat /var/lib/jenkins/secrets/initialAdminPassword")

echo ""
echo "Jenkins setup completed successfully!"
echo "================================================="
echo "Access Jenkins at: http://$EC2_HOST:8080"
echo "Initial admin password: $JENKINS_PASSWORD"
echo ""
echo "Next steps:"
echo "1. Open http://$EC2_HOST:8080 in your browser"
echo "2. Enter the initial admin password shown above"
echo "3. Install suggested plugins"
echo "4. Create an admin user"
echo "5. Configure Jenkins with the credentials as described in jenkins-ec2-setup.md"
echo "6. Create a pipeline job using the Jenkinsfile"
echo ""
echo "For detailed instructions, refer to jenkins-ec2-setup.md"
