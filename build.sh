#!/bin/bash

# Master build script for Enthalpy project
# Builds both main server and computer-use-service Docker images

set -e  # Exit on error

echo "=========================================="
echo "Enthalpy - Master Build Script"
echo "=========================================="

# Check environment variables (defaults)
REBUILD_CU_BASE=${REBUILD_CU_BASE:-0}
BUILD_CU=${BUILD_CU:-1}

echo ""
echo "Build Configuration:"
echo "  REBUILD_CU_BASE: $REBUILD_CU_BASE"
echo "  BUILD_CU: $BUILD_CU"
echo ""

# Step 1 & 2: Build computer-use-service images (if requested)
if [ "$BUILD_CU" = "1" ]; then
  # Step 1a: Build base image (if requested)
  if [ "$REBUILD_CU_BASE" = "1" ]; then
    echo "Step 1: Building computer-use-service base image..."
    echo "----------------------------------------"
    cd computer-use-service
    docker build -f Dockerfile.base -t computer-use-base:latest .
    cd ..
    echo "✓ Base image built successfully"
    echo ""
  else
    echo "Step 1: Skipping base image rebuild (REBUILD_CU_BASE=0)"
    echo "----------------------------------------"
    echo "To rebuild base image, run: REBUILD_CU_BASE=1 ./build.sh"
    echo ""
  fi

  # Step 1b: Build computer-use-service image
  echo "Step 2: Building computer-use-service Docker image..."
  echo "----------------------------------------"
  cd computer-use-service
  docker build -t computer-use-service:latest .
  cd ..
  echo "✓ Computer-use-service image built successfully"
  echo ""
else
  echo "Step 1-2: Skipping computer-use-service builds (BUILD_CU=0)"
  echo "----------------------------------------"
  echo "To build CU service, run: BUILD_CU=1 ./build.sh"
  echo ""
fi

# Step 3: Build main server image
echo "Step 3: Building main server Docker image..."
echo "----------------------------------------"
docker build -t enthalpy:latest .
echo "✓ Main server image built successfully"
echo ""

echo "=========================================="
echo "Build Complete!"
echo "=========================================="
echo ""
echo "Images built:"
if [ "$REBUILD_CU_BASE" = "1" ]; then
  echo "  - computer-use-base:latest (base image)"
fi
if [ "$BUILD_CU" = "1" ]; then
  echo "  - computer-use-service:latest"
fi
echo "  - enthalpy:latest"
echo ""
echo "Next steps:"
echo "  docker-compose up    # Start all services"
echo "  docker run enthalpy:latest  # Run main server"
echo ""
