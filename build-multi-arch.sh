#!/bin/sh
set -e

# Enable Docker BuildKit
export DOCKER_BUILDKIT=1

# Create and use a new builder with multi-architecture support
docker buildx create --name multiarch-builder --use

# Build and push backend image for multiple architectures
echo "Building and pushing multi-architecture backend image..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t edensit139/whatsy:backend-prod \
  --push \
  ./backend

# Build and push frontend image for multiple architectures
echo "Building and pushing multi-architecture frontend image..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t edensit139/whatsy:frontend-prod \
  --push \
  ./frontend

# Remove the builder
docker buildx rm multiarch-builder

echo "Multi-architecture images built and pushed successfully!"
