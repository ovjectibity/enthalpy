#!/bin/bash

# Master build script for Enthalpy project
# Supports local and remote build modes

set -e  # Exit on error

echo "=========================================="
echo "Enthalpy - Master Build Script"
echo "=========================================="

# Check environment variables (defaults)
BUILD_MODE=${BUILD_MODE:-local}  # 'local' or 'remote'
REBUILD_CU_BASE=${REBUILD_CU_BASE:-0}
CU_REMOTE_HOST=${CU_REMOTE_HOST}
CU_REMOTE_USER=${CU_REMOTE_USER:-ubuntu}
CU_REMOTE_PATH=${CU_REMOTE_PATH:-~}  # Base directory on remote host

echo ""
echo "Build Configuration:"
echo "  BUILD_MODE: $BUILD_MODE"
echo "  REBUILD_CU_BASE: $REBUILD_CU_BASE"
if [ "$BUILD_MODE" = "local" ]; then
  echo "  CU_REMOTE_HOST: $CU_REMOTE_HOST"
  echo "  CU_REMOTE_PATH: $CU_REMOTE_PATH"
fi
echo ""

if [ "$BUILD_MODE" = "local" ]; then
  # ============================================
  # LOCAL BUILD MODE
  # ============================================
  # Build server locally (npm build), build CU image remotely via SSH

  # Validate remote host is set
  if [ -z "$CU_REMOTE_HOST" ]; then
    echo "Error: CU_REMOTE_HOST must be set for local build mode"
    exit 1
  fi

  # Step 1: Build server locally using npm
  echo "Step 1: Building server locally (npm build)..."
  echo "----------------------------------------"
  npm run build
  echo "✓ Server built successfully"
  echo ""

  # Step 2: Build CU base image remotely (if requested)
  if [ "$REBUILD_CU_BASE" = "1" ]; then
    echo "Step 2: Building computer-use-service base image on remote host..."
    echo "----------------------------------------"
    ssh ${CU_REMOTE_USER}@${CU_REMOTE_HOST} "cd ${CU_REMOTE_PATH}/enthalpy/computer-use-service && docker build -f Dockerfile.base -t computer-use-base:latest ."
    echo "✓ Remote base image built successfully"
    echo ""
  else
    echo "Step 2: Skipping remote base image rebuild (REBUILD_CU_BASE=0)"
    echo "----------------------------------------"
    echo ""
  fi

  # Step 3: Build CU service image remotely
  echo "Step 3: Building computer-use-service image on remote host..."
  echo "----------------------------------------"
  ssh ${CU_REMOTE_USER}@${CU_REMOTE_HOST} "cd ${CU_REMOTE_PATH}/enthalpy && docker build -f computer-use-service/Dockerfile -t computer-use-service:latest ."
  echo "✓ Remote computer-use-service image built successfully"
  echo ""

  echo "=========================================="
  echo "Local Build Complete!"
  echo "=========================================="
  echo ""
  echo "Built:"
  echo "  - Server (locally via npm)"
  if [ "$REBUILD_CU_BASE" = "1" ]; then
    echo "  - computer-use-base:latest (remote)"
  fi
  echo "  - computer-use-service:latest (remote)"
  echo ""

else
  # ============================================
  # REMOTE BUILD MODE
  # ============================================
  # Build Docker images for both server and CU service

  # Step 1: Build CU base image (if requested)
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
    echo ""
  fi

  # Step 2: Build CU service image
  echo "Step 2: Building computer-use-service Docker image..."
  echo "----------------------------------------"
  docker build -f computer-use-service/Dockerfile -t computer-use-service:latest .
  echo "✓ Computer-use-service image built successfully"
  echo ""

  # Step 3: Build images defined in docker-compose
  echo "Step 3: Building images via docker compose..."
  echo "----------------------------------------"
  docker compose build
  echo "✓ Docker compose build completed successfully"
  echo ""

  echo "=========================================="
  echo "Remote Build Complete!"
  echo "=========================================="
  echo ""
  echo "Images built:"
  if [ "$REBUILD_CU_BASE" = "1" ]; then
    echo "  - computer-use-base:latest"
  fi
  echo "  - computer-use-service:latest"
  echo "  - All images from compose.yml (enthalpy_app, postgresdb, mongodb)"
  echo ""
  echo "Next steps:"
  echo "  docker compose up    # Start all services"
  echo ""
fi
