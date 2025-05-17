#!/bin/bash
set -e

# Create certs directory if it doesn't exist
mkdir -p ./backend/certs

# Define certificate paths
CERT_PATH="./backend/certs/cert.pem"
KEY_PATH="./backend/certs/key.pem"

# Check if OpenSSL is installed
if ! command -v openssl &> /dev/null; then
    echo "Error: OpenSSL is not installed. Please install it first."
    exit 1
fi

echo "Generating self-signed SSL certificates for development..."

# Generate a self-signed certificate valid for 365 days
openssl req -x509 -newkey rsa:4096 -keyout "$KEY_PATH" -out "$CERT_PATH" -days 365 -nodes -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,DNS:whatsy-backend,IP:127.0.0.1,IP:13.219.30.68"

# Set appropriate permissions
chmod 600 "$KEY_PATH"
chmod 644 "$CERT_PATH"

echo "SSL certificates generated successfully!"
echo "Certificate: $CERT_PATH"
echo "Private Key: $KEY_PATH"
echo ""
echo "To enable HTTPS, add the following to your backend/.env file:"
echo "ENABLE_HTTPS=true"
echo "SSL_CERT_PATH=./certs/cert.pem"
echo "SSL_KEY_PATH=./certs/key.pem"
echo "HTTPS_PORT=443"
echo ""
echo "Note: These are self-signed certificates for development only."
echo "For production, use certificates from a trusted CA like Let's Encrypt."
