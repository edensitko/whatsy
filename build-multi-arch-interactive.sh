#!/bin/bash
set -e

echo "Building Multi-Architecture Docker Image for WhatsApp Interactive Features"
echo "========================================================================"

# Enable Docker BuildKit for multi-architecture builds
export DOCKER_BUILDKIT=1

# Create builder instance if it doesn't exist
if ! docker buildx inspect multiarch-builder &>/dev/null; then
  echo "Creating multi-architecture builder..."
  docker buildx create --name multiarch-builder --use
fi

# Switch to the builder
docker buildx use multiarch-builder

# Bootstrap the builder
docker buildx inspect --bootstrap

# Build and push multi-architecture image
echo "Building and pushing multi-architecture image..."
cd /Users/edensitkovetsky/Desktop/id-profiles-generator-main/backend
docker buildx build --platform linux/amd64,linux/arm64 \
  -t edensit139/whatsy:backend-prod-interactive \
  --push .

echo ""
echo "Multi-architecture image built and pushed successfully!"
echo "You can now deploy it to your EC2 instance."
