# Setting Up HTTPS for Your Backend

This guide will walk you through the process of enabling HTTPS for your backend to securely receive Twilio webhooks.

## Option 1: Self-Signed Certificates (Development Only)

### Step 1: Generate SSL Certificates

Run the provided script to generate self-signed SSL certificates:

```bash
./generate-ssl-certs.sh
```

This will create:
- `backend/certs/cert.pem` - The SSL certificate
- `backend/certs/key.pem` - The private key

### Step 2: Update Environment Variables

Add the following to your `backend/.env` file:

```
ENABLE_HTTPS=true
SSL_CERT_PATH=./certs/cert.pem
SSL_KEY_PATH=./certs/key.pem
HTTPS_PORT=443
```

### Step 3: Rebuild and Restart Your Backend

```bash
docker stop whatsy-backend
docker rm whatsy-backend
docker build -t edensit139/whatsy:backend-prod ./backend
docker run -d \
  --name whatsy-backend \
  --network whatsy-network \
  --dns 8.8.8.8 --dns 8.8.4.4 \
  -p 5000:5000 \
  -p 443:443 \
  -v $(pwd)/backend/certs:/app/certs \
  --env-file backend.env \
  --restart unless-stopped \
  edensit139/whatsy:backend-prod
```

## Option 2: Let's Encrypt Certificates (Production)

For production, you should use certificates from a trusted Certificate Authority like Let's Encrypt.

### Step 1: Install Certbot

On your Ubuntu server:

```bash
sudo apt update
sudo apt install -y certbot
```

### Step 2: Obtain SSL Certificates

```bash
sudo certbot certonly --standalone -d your-domain.com
```

This will create certificates at:
- `/etc/letsencrypt/live/your-domain.com/fullchain.pem`
- `/etc/letsencrypt/live/your-domain.com/privkey.pem`

### Step 3: Update Environment Variables

Add the following to your `backend/.env` file:

```
ENABLE_HTTPS=true
SSL_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem
HTTPS_PORT=443
```

### Step 4: Run Your Backend with Certificate Volume Mounts

```bash
docker run -d \
  --name whatsy-backend \
  --network whatsy-network \
  --dns 8.8.8.8 --dns 8.8.4.4 \
  -p 5000:5000 \
  -p 443:443 \
  -v /etc/letsencrypt:/etc/letsencrypt \
  --env-file backend.env \
  --restart unless-stopped \
  edensit139/whatsy:backend-prod
```

## Option 3: Using Nginx as a Reverse Proxy (Recommended for Production)

### Step 1: Install Nginx

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Step 2: Configure Nginx

Create a new Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/whatsy
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 3: Enable the Site and Get SSL Certificates

```bash
sudo ln -s /etc/nginx/sites-available/whatsy /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-domain.com
sudo systemctl restart nginx
```

### Step 4: Run Your Backend Without HTTPS (Nginx will handle SSL)

```bash
docker run -d \
  --name whatsy-backend \
  --network whatsy-network \
  --dns 8.8.8.8 --dns 8.8.4.4 \
  -p 5000:5000 \
  --env-file backend.env \
  --restart unless-stopped \
  edensit139/whatsy:backend-prod
```

## Configuring Twilio Webhook with HTTPS

Once you have HTTPS set up, configure your Twilio webhook URL to use HTTPS:

1. Log in to your [Twilio Console](https://www.twilio.com/console)
2. Navigate to **Messaging** > **Settings** > **WhatsApp Sandbox Settings**
3. Set the **WHEN A MESSAGE COMES IN** field to:
   ```
   https://your-domain.com/api/webhook/twilio
   ```
   or if using the server IP:
   ```
   https://13.219.30.68/api/webhook/twilio
   ```
4. Click **Save**

## Testing Your HTTPS Webhook

1. Send a message to your Twilio WhatsApp number
2. Check your backend logs for incoming webhook requests:
   ```bash
   docker logs whatsy-backend
   ```
3. You should see logs indicating that your backend received the webhook and processed the message securely over HTTPS

## Troubleshooting

- **Certificate Issues**: If you're using self-signed certificates, Twilio may reject the webhook. Use Let's Encrypt for production.
- **Port Access**: Make sure port 443 is open in your server's security group/firewall.
- **Permission Issues**: If using Let's Encrypt certificates, ensure your Docker container has permission to read them.
