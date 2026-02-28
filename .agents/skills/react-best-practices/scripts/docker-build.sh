#!/bin/bash
# React Docker 构建脚本

set -e

IMAGE_NAME=${1:-react-app}
TAG=${2:-latest}
DOCKERFILE=${DOCKERFILE:-Dockerfile.nginx}

echo "🐳 Building Docker image..."
echo "   Image: $IMAGE_NAME:$TAG"
echo "   Dockerfile: $DOCKERFILE"
echo ""

docker build -f "$DOCKERFILE" -t "$IMAGE_NAME:$TAG" .

echo ""
echo "✅ Build completed!"
echo "   Run: docker run -p 80:80 $IMAGE_NAME:$TAG"
