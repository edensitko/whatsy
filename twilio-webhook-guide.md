# Setting Up Your Backend as a Twilio Webhook for WhatsApp

This guide will walk you through the process of configuring your backend to receive WhatsApp messages from Twilio.

## Prerequisites

1. A Twilio account with WhatsApp Sandbox enabled
2. Your backend deployed and accessible from the internet
3. Twilio Account SID and Auth Token (found in your Twilio dashboard)

## Step 1: Configure Your Backend Environment Variables

Ensure your backend has the necessary Twilio credentials in the `.env` file:

```
TWILIO_ACCOUNT_SID=ACc51b1aea3e74f0c2cb89fcb4de030416
TWILIO_AUTH_TOKEN=3d3f301094a44e2fc5a014ba709e2386
WHATSAPP_PHONE_NUMBER=14155238886
```

## Step 2: Make Your Backend Accessible from the Internet

Your backend must be accessible from the internet for Twilio to send webhooks. Your backend is currently running at:

```
http://54.89.205.239:5000
```

Ensure port 5000 is open in your server's security group/firewall.

## Step 3: Configure Twilio to Send WhatsApp Messages to Your Webhook

1. Log in to your [Twilio Console](https://www.twilio.com/console)
2. Navigate to **Messaging** > **Settings** > **WhatsApp Sandbox Settings**
3. Set the **WHEN A MESSAGE COMES IN** field to:
   ```
   http://54.89.205.239:5000/api/webhook/twilio
   ```
4. Click **Save**

## Step 4: Test the Webhook Integration

1. Send a message to your Twilio WhatsApp number
2. Check your backend logs for incoming webhook requests:
   ```bash
   docker logs whatsy-backend
   ```
3. You should see logs indicating that your backend received the webhook and processed the message

## Step 5: Verify Webhook Security

Your backend is already configured to validate that incoming requests are genuinely from Twilio using the `validateRequest` function from the Twilio SDK.

## Troubleshooting

If you're not receiving webhooks:

1. **Check Backend Logs**: Look for any errors in your backend logs
2. **Verify Accessibility**: Make sure your backend is accessible from the internet
3. **Check Twilio Configuration**: Ensure the webhook URL is correctly set in Twilio
4. **Inspect Twilio Logs**: Check the Twilio console for any webhook delivery failures
5. **Test Webhook Manually**: Use a tool like Postman to send a test request to your webhook endpoint

## Advanced Configuration

### Setting Up a Production Domain

For production, it's recommended to use a proper domain name instead of an IP address:

1. Register a domain name (if you don't already have one)
2. Set up DNS records to point to your server IP
3. Configure a reverse proxy (like Nginx) to forward requests to your backend
4. Update your Twilio webhook URL to use your domain name

### Using HTTPS

For enhanced security, configure HTTPS for your webhook:

1. Obtain an SSL certificate (e.g., using Let's Encrypt)
2. Configure your reverse proxy to use HTTPS
3. Update your Twilio webhook URL to use HTTPS

## Additional Resources

- [Twilio WhatsApp API Documentation](https://www.twilio.com/docs/whatsapp/api)
- [Twilio Webhook Security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)
