pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'edensit139'
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/whatsy:backend-prod"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/whatsy:frontend-prod"
        DOCKER_CREDENTIALS_ID = 'dockerhub-creds'
        EC2_HOST = '13.219.30.68'
        EC2_USER = 'ubuntu'
        EC2_CREDENTIALS_ID = 'ec2-ssh-key'
        NODE_VERSION = '18.20.8'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup Environment') {
            steps {
                sh '''
                    # Install Docker if not present
                    if ! command -v docker &> /dev/null; then
                        echo "Installing Docker..."
                        sudo apt-get update
                        sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
                        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
                        sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
                        sudo apt-get update
                        sudo apt-get install -y docker-ce docker-ce-cli containerd.io
                        sudo systemctl start docker
                        sudo systemctl enable docker
                        sudo usermod -aG docker jenkins
                        sudo systemctl restart jenkins
                        # Since we just added the jenkins user to the docker group,
                        # we need to run Docker commands with sudo until the next login
                        echo "Docker installed. You may need to run this pipeline again after Jenkins restarts."
                    fi
                    
                    # Install Node.js using NVM
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm
                    
                    # Install NVM if not present
                    if ! command -v nvm &> /dev/null; then
                        echo "Installing NVM..."
                        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
                        export NVM_DIR="$HOME/.nvm"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm
                    fi
                    
                    # Install specific Node.js version
                    nvm install ${NODE_VERSION}
                    nvm use ${NODE_VERSION}
                    
                    # Verify installations
                    echo "Docker version:"
                    sudo docker --version || true
                    echo "Node version:"
                    node --version || true
                    echo "NPM version:"
                    npm --version || true
                '''
            }
        }
        
        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh '''
                        echo "Building backend application..."
                        npm ci
                        npm run build
                    '''
                    
                    script {
                        try {
                            sh "sudo docker build -t ${BACKEND_IMAGE} ."
                            echo "Backend Docker image built successfully"
                        } catch (Exception e) {
                            error "Failed to build backend Docker image: ${e.message}"
                        }
                    }
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh '''
                        echo "Building frontend application..."
                        npm ci
                        npm run build
                    '''
                    
                    // Check if nginx.conf exists, create if not
                    sh '''
                        if [ ! -f nginx.conf ]; then
                            echo "Creating nginx.conf..."
                            cat > nginx.conf << 'EOL'
server {
    listen 80;
    server_name _;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://whatsy-backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL
                        fi
                    '''
                    
                    script {
                        try {
                            sh "sudo docker build -t ${FRONTEND_IMAGE} ."
                            echo "Frontend Docker image built successfully"
                        } catch (Exception e) {
                            error "Failed to build frontend Docker image: ${e.message}"
                        }
                    }
                }
            }
        }
        
        stage('Push Images') {
            steps {
                echo "Starting Docker login with credentials ID: ${DOCKER_CREDENTIALS_ID}"
                echo "Docker registry: ${DOCKER_REGISTRY}"
                
                script {
                    withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                        try {
                            sh '''
                                echo "Attempting to log in to Docker Hub..."
                                echo "$DOCKER_PASSWORD" | sudo docker login -u "$DOCKER_USERNAME" --password-stdin
                                echo "Docker login successful"
                            '''
                            
                            sh "sudo docker push ${BACKEND_IMAGE}"
                            echo "Backend image pushed successfully"
                            
                            sh "sudo docker push ${FRONTEND_IMAGE}"
                            echo "Frontend image pushed successfully"
                            
                        } catch (Exception e) {
                            error "Failed to push Docker images: ${e.message}"
                        }
                    }
                }
            }
        }
        
        stage('Deploy to EC2') {
            steps {
                echo "Starting deployment to EC2..."
                
                script {
                    withCredentials([
                        sshUserPrivateKey(credentialsId: EC2_CREDENTIALS_ID, keyFileVariable: 'SSH_KEY'),
                        string(credentialsId: 'openai-api-key', variable: 'OPENAI_API_KEY', defaultValue: ''),
                        string(credentialsId: 'twilio-account-sid', variable: 'TWILIO_ACCOUNT_SID', defaultValue: ''),
                        string(credentialsId: 'twilio-auth-token', variable: 'TWILIO_AUTH_TOKEN', defaultValue: ''),
                        string(credentialsId: 'firebase-api-key', variable: 'FIREBASE_API_KEY', defaultValue: ''),
                        string(credentialsId: 'firebase-auth-domain', variable: 'FIREBASE_AUTH_DOMAIN', defaultValue: ''),
                        string(credentialsId: 'firebase-project-id', variable: 'FIREBASE_PROJECT_ID', defaultValue: ''),
                        string(credentialsId: 'firebase-storage-bucket', variable: 'FIREBASE_STORAGE_BUCKET', defaultValue: ''),
                        string(credentialsId: 'firebase-messaging-sender-id', variable: 'FIREBASE_MESSAGING_SENDER_ID', defaultValue: ''),
                        string(credentialsId: 'firebase-app-id', variable: 'FIREBASE_APP_ID', defaultValue: '')
                    ]) {
                        try {
                            // Create deployment script
                            writeFile file: 'deploy.sh', text: """
#!/bin/bash
set -e

# Pull the latest images
echo "Pulling latest Docker images..."
docker pull ${BACKEND_IMAGE}
docker pull ${FRONTEND_IMAGE}

# Stop and remove existing containers
echo "Stopping and removing existing containers..."
docker stop whatsy-backend || true
docker rm whatsy-backend || true
docker stop whatsy-frontend || true
docker rm whatsy-frontend || true

# Create network if it doesn't exist
echo "Setting up Docker network..."
docker network inspect whatsy-network >/dev/null 2>&1 || docker network create whatsy-network

# Ensure certs directory exists
mkdir -p ~/certs

# Run backend container with credentials from Jenkins
echo "Starting backend container..."
docker run -d \
  --name whatsy-backend \
  --network whatsy-network \
  --dns 8.8.8.8 --dns 8.8.4.4 \
  -p 5000:5000 \
  -p 443:443 \
  -v ~/certs:/app/certs \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e ENABLE_HTTPS=true \
  -e SSL_CERT_PATH=./certs/cert.pem \
  -e SSL_KEY_PATH=./certs/key.pem \
  -e OPENAI_API_KEY='${OPENAI_API_KEY}' \
  -e TWILIO_ACCOUNT_SID='${TWILIO_ACCOUNT_SID}' \
  -e TWILIO_AUTH_TOKEN='${TWILIO_AUTH_TOKEN}' \
  -e FIREBASE_API_KEY='${FIREBASE_API_KEY}' \
  -e FIREBASE_AUTH_DOMAIN='${FIREBASE_AUTH_DOMAIN}' \
  -e FIREBASE_PROJECT_ID='${FIREBASE_PROJECT_ID}' \
  -e FIREBASE_STORAGE_BUCKET='${FIREBASE_STORAGE_BUCKET}' \
  -e FIREBASE_MESSAGING_SENDER_ID='${FIREBASE_MESSAGING_SENDER_ID}' \
  -e FIREBASE_APP_ID='${FIREBASE_APP_ID}' \
  --restart unless-stopped \
  ${BACKEND_IMAGE}

# Run frontend container
echo "Starting frontend container..."
docker run -d \
  --name whatsy-frontend \
  --network whatsy-network \
  --dns 8.8.8.8 --dns 8.8.4.4 \
  -p 3000:80 \
  --restart unless-stopped \
  ${FRONTEND_IMAGE}

echo "Deployment completed successfully!"
"""

                            // Copy deployment script to EC2 and execute
                            sh """
                                chmod +x deploy.sh
                                scp -i "\$SSH_KEY" -o StrictHostKeyChecking=no deploy.sh ${EC2_USER}@${EC2_HOST}:~/deploy.sh
                                ssh -i "\$SSH_KEY" -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} 'chmod +x ~/deploy.sh && ~/deploy.sh'
                                rm deploy.sh
                            """
                        } catch (Exception e) {
                            error "Deployment to EC2 failed: ${e.message}"
                        }
                    }
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                echo "Verifying deployment..."
                
                script {
                    withCredentials([sshUserPrivateKey(credentialsId: EC2_CREDENTIALS_ID, keyFileVariable: 'SSH_KEY')]) {
                        try {
                            def verificationResult = sh(
                                script: """
                                    ssh -i "\$SSH_KEY" -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} '
                                        # Check if containers are running
                                        echo "Checking container status:"
                                        docker ps | grep whatsy-backend
                                        docker ps | grep whatsy-frontend
                                        
                                        # Check backend health
                                        echo "Checking backend health:"
                                        curl -s http://localhost:5000/api/health || echo "Backend health check failed!"
                                        
                                        # Check frontend accessibility
                                        echo "Checking frontend accessibility:"
                                        curl -s -I http://localhost:3000 | grep -i "HTTP/1.1 200 OK" || echo "Frontend accessibility check failed!"
                                    '
                                """,
                                returnStatus: true
                            )
                            
                            if (verificationResult != 0) {
                                error "Deployment verification failed. Check the logs for details."
                            }
                        } catch (Exception e) {
                            error "Verification failed: ${e.message}"
                        }
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo 'Deployment successful! Your application is now running on the EC2 instance.'
        }
        failure {
            echo 'Deployment failed! Please check the console output above for detailed error messages.'
        }
        always {
            echo 'Pipeline completed. Check the logs for any issues.'
        }
    }
}
