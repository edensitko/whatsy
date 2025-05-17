pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'edensit139'
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/whatsy:backend-prod"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/whatsy:frontend-prod"
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
        EC2_HOST = '13.219.30.68'
        EC2_USER = 'ubuntu'
        EC2_CREDENTIALS_ID = 'ec2-ssh-key'
        NVM_DIR = "$HOME/.nvm"
        NODE_VERSION = '18.20.8'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup Node.js') {
            steps {
                sh '''
                    # Install Node.js without sudo using NVM
                    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
                    export NVM_DIR="$HOME/.nvm"
                    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm
                    [ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
                    
                    # Install specific Node.js version
                    nvm install ${NODE_VERSION}
                    nvm alias default ${NODE_VERSION}
                    nvm use default
                    
                    # Create a .nvmrc file to ensure consistent Node.js version
                    echo ${NODE_VERSION} > .nvmrc
                    
                    # Verify installation
                    node --version
                    npm --version
                    
                    # Add NVM to Jenkins shell initialization
                    echo 'export NVM_DIR="$HOME/.nvm"' >> $HOME/.bashrc
                    echo '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"' >> $HOME/.bashrc
                '''
            }
        }
        
        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh '''
                        # Load NVM and use the installed Node.js version
                        export NVM_DIR="$HOME/.nvm"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use ${NODE_VERSION}
                        
                        npm install
                        npm run build
                    '''
                    sh "docker build -t ${BACKEND_IMAGE} ."
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh '''
                        # Load NVM and use the installed Node.js version
                        export NVM_DIR="$HOME/.nvm"
                        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
                        nvm use ${NODE_VERSION}
                        
                        npm install
                        npm run build
                    '''
                    sh "docker build -t ${FRONTEND_IMAGE} ."
                }
            }
        }
        
        stage('Push Images') {
            steps {
                withCredentials([string(credentialsId: DOCKER_CREDENTIALS_ID, variable: 'DOCKER_PASSWORD')]) {
                    sh "echo $DOCKER_PASSWORD | docker login -u ${DOCKER_REGISTRY} --password-stdin"
                    sh "docker push ${BACKEND_IMAGE}"
                    sh "docker push ${FRONTEND_IMAGE}"
                }
            }
        }
        
        stage('Deploy to EC2') {
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: EC2_CREDENTIALS_ID, keyFileVariable: 'SSH_KEY'),
                    string(credentialsId: 'openai-api-key', variable: 'OPENAI_API_KEY'),
                    string(credentialsId: 'twilio-account-sid', variable: 'TWILIO_ACCOUNT_SID'),
                    string(credentialsId: 'twilio-auth-token', variable: 'TWILIO_AUTH_TOKEN'),
                    string(credentialsId: 'firebase-api-key', variable: 'FIREBASE_API_KEY'),
                    string(credentialsId: 'firebase-auth-domain', variable: 'FIREBASE_AUTH_DOMAIN'),
                    string(credentialsId: 'firebase-project-id', variable: 'FIREBASE_PROJECT_ID'),
                    string(credentialsId: 'firebase-storage-bucket', variable: 'FIREBASE_STORAGE_BUCKET'),
                    string(credentialsId: 'firebase-messaging-sender-id', variable: 'FIREBASE_MESSAGING_SENDER_ID'),
                    string(credentialsId: 'firebase-app-id', variable: 'FIREBASE_APP_ID')
                ]) {
                    sh """
                        ssh -i \$SSH_KEY -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} '
                            # Pull the latest images
                            docker pull ${BACKEND_IMAGE}
                            docker pull ${FRONTEND_IMAGE}
                            
                            # Stop and remove existing containers
                            docker stop whatsy-backend || true
                            docker rm whatsy-backend || true
                            docker stop whatsy-frontend || true
                            docker rm whatsy-frontend || true
                            
                            # Create network if it doesn't exist
                            docker network inspect whatsy-network >/dev/null 2>&1 || docker network create whatsy-network
                            
                            # Run backend container with credentials from Jenkins
                            docker run -d \\
                              --name whatsy-backend \\
                              --network whatsy-network \\
                              --dns 8.8.8.8 --dns 8.8.4.4 \\
                              -p 5000:5000 \\
                              -p 443:443 \\
                              -v ~/certs:/app/certs \\
                              -e OPENAI_API_KEY='${OPENAI_API_KEY}' \\
                              -e TWILIO_ACCOUNT_SID='${TWILIO_ACCOUNT_SID}' \\
                              -e TWILIO_AUTH_TOKEN='${TWILIO_AUTH_TOKEN}' \\
                              -e FIREBASE_API_KEY='${FIREBASE_API_KEY}' \\
                              -e FIREBASE_AUTH_DOMAIN='${FIREBASE_AUTH_DOMAIN}' \\
                              -e FIREBASE_PROJECT_ID='${FIREBASE_PROJECT_ID}' \\
                              -e FIREBASE_STORAGE_BUCKET='${FIREBASE_STORAGE_BUCKET}' \\
                              -e FIREBASE_MESSAGING_SENDER_ID='${FIREBASE_MESSAGING_SENDER_ID}' \\
                              -e FIREBASE_APP_ID='${FIREBASE_APP_ID}' \\
                              -e PORT=5000 \\
                              -e NODE_ENV=production \\
                              -e ENABLE_HTTPS=true \\
                              -e SSL_CERT_PATH=./certs/cert.pem \\
                              -e SSL_KEY_PATH=./certs/key.pem \\
                              -e HTTPS_PORT=443 \\
                              --restart unless-stopped \\
                              ${BACKEND_IMAGE}
                              
                            # Run frontend container
                            docker run -d \\
                              --name whatsy-frontend \\
                              --network whatsy-network \\
                              --dns 8.8.8.8 --dns 8.8.4.4 \\
                              -p 3000:80 \\
                              --restart unless-stopped \\
                              ${FRONTEND_IMAGE}
                        '
                    """
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: EC2_CREDENTIALS_ID, keyFileVariable: 'SSH_KEY')]) {
                    sh """
                        ssh -i \$SSH_KEY -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} '
                            # Check if containers are running
                            echo "Checking backend container status:"
                            docker ps | grep whatsy-backend || echo "Backend container not running!"
                            
                            echo "Checking frontend container status:"
                            docker ps | grep whatsy-frontend || echo "Frontend container not running!"
                            
                            # Check backend health
                            echo "Checking backend health:"
                            curl -s http://localhost:5000/api/health || echo "Backend health check failed!"
                        '
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}
