# Setting Up Jenkins on EC2 for Whatsy App Deployment

This guide walks you through setting up Jenkins on your EC2 instance to automate the build and deployment process for your Whatsy application.

## 1. SSH into Your EC2 Instance

```bash
ssh -i ~/Downloads/mymymymy.pem ubuntu@13.219.30.68
```

## 2. Install Jenkins

### Update System Packages
```bash
sudo apt update
sudo apt upgrade -y
```

### Install Java (Required for Jenkins)
```bash
sudo apt install -y openjdk-11-jdk
```

### Add Jenkins Repository
```bash
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
```

### Install Jenkins
```bash
sudo apt install -y jenkins
```

### Start Jenkins Service
```bash
sudo systemctl enable jenkins
sudo systemctl start jenkins
```

### Check Jenkins Status
```bash
sudo systemctl status jenkins
```

## 3. Configure Firewall to Allow Jenkins

```bash
# Allow port 8080 for Jenkins web interface
sudo ufw allow 8080

# Enable firewall if not already enabled
sudo ufw enable
```

## 4. Install Docker (Required for Building and Running Containers)

```bash
# Install Docker
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt update
sudo apt install -y docker-ce

# Add jenkins user to docker group
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

## 5. Access Jenkins Web Interface

1. Open a web browser and navigate to:
   ```
   http://13.219.30.68:8080
   ```

2. Retrieve the initial admin password:
   ```bash
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```

3. Follow the on-screen instructions to complete the setup:
   - Install suggested plugins
   - Create an admin user
   - Configure Jenkins URL

## 6. Configure Jenkins Credentials

1. Go to **Dashboard > Manage Jenkins > Manage Credentials**
2. Click on **Jenkins** under **Stores scoped to Jenkins**
3. Click on **Global credentials (unrestricted)**
4. Click on **Add Credentials** to add the following credentials:

### Docker Hub Credentials
- **Kind**: Username with password
- **Scope**: Global
- **Username**: edensit139
- **Password**: [Your Docker Hub password]
- **ID**: docker-hub-credentials
- **Description**: Docker Hub Credentials

### EC2 SSH Key
- **Kind**: SSH Username with private key
- **Scope**: Global
- **Username**: ubuntu
- **Private Key**: [Contents of your mymymymy.pem file]
- **ID**: ec2-ssh-key
- **Description**: EC2 SSH Key

## 7. Install Required Jenkins Plugins

Go to **Dashboard > Manage Jenkins > Manage Plugins > Available** and install:
- Docker Pipeline
- SSH Agent
- Pipeline Utility Steps

## 8. Create Your Jenkins Pipeline

1. Go to **Dashboard > New Item**
2. Enter a name (e.g., "Whatsy-Deployment")
3. Select **Pipeline** and click **OK**
4. In the configuration page:
   - Under **Pipeline**, select **Pipeline script from SCM**
   - **SCM**: Git
   - **Repository URL**: [Your Git repository URL]
   - **Credentials**: [Add your Git credentials if needed]
   - **Branch Specifier**: */main
   - **Script Path**: Jenkinsfile
5. Click **Save**

## 9. Prepare Your EC2 Instance for Deployment

### Create SSL Certificates Directory
```bash
mkdir -p ~/certs
```

### Generate Self-Signed SSL Certificates
```bash
openssl req -x509 -newkey rsa:4096 -keyout ~/certs/key.pem -out ~/certs/cert.pem -days 365 -nodes -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,DNS:whatsy-backend,IP:127.0.0.1,IP:13.219.30.68"
chmod 600 ~/certs/key.pem
chmod 644 ~/certs/cert.pem
```

### Create Environment File
```bash
cat > ~/.env << 'EOL'
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
FIREBASE_PROJECT_ID=your_firebase_project_id_here
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
FIREBASE_APP_ID=your_firebase_app_id_here

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
WHATSAPP_PHONE_NUMBER=your_whatsapp_phone_number_here

# Server Configuration
PORT=5000
NODE_ENV=production

# HTTPS Configuration
ENABLE_HTTPS=true
SSL_CERT_PATH=./certs/cert.pem
SSL_KEY_PATH=./certs/key.pem
HTTPS_PORT=443
EOL
```

## 10. Trigger Your First Build

1. Go to **Dashboard > Whatsy-Deployment**
2. Click **Build Now**
3. Monitor the build progress in the **Build History**
4. Click on the build number and then **Console Output** to see detailed logs

## 11. Set Up Webhook for Automatic Builds (Optional)

1. Go to **Dashboard > Whatsy-Deployment > Configure**
2. Check **GitHub hook trigger for GITScm polling** under **Build Triggers**
3. Configure a webhook in your GitHub repository:
   - **Payload URL**: http://13.219.30.68:8080/github-webhook/
   - **Content type**: application/json
   - **Secret**: [Create a secret]
   - **Events**: Just the push event

## 12. Access Your Deployed Application

- Frontend: http://13.219.30.68:3000
- Backend: http://13.219.30.68:5000
- Backend with HTTPS: https://13.219.30.68

## Troubleshooting

### Jenkins Cannot Access Docker
```bash
sudo chmod 666 /var/run/docker.sock
sudo systemctl restart jenkins
```

### Permission Issues with SSL Certificates
```bash
sudo chown -R jenkins:jenkins ~/certs
```

### Check Jenkins Logs
```bash
sudo tail -f /var/log/jenkins/jenkins.log
```

### Check Container Logs
```bash
docker logs whatsy-backend
docker logs whatsy-frontend
```
