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
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npm run build'
                    sh "docker build -t ${BACKEND_IMAGE} ."
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
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
                withCredentials([sshUserPrivateKey(credentialsId: EC2_CREDENTIALS_ID, keyFileVariable: 'SSH_KEY')]) {
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
                            
                            # Run backend container
                            docker run -d \\
                              --name whatsy-backend \\
                              --network whatsy-network \\
                              --dns 8.8.8.8 --dns 8.8.4.4 \\
                              -p 5000:5000 \\
                              -p 443:443 \\
                              -v ~/certs:/app/certs \\
                              --env-file ~/.env \\
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
