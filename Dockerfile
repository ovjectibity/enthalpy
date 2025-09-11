# Use Node.js 18 LTS as the base image
FROM node:18-slim

# Install system dependencies required for the application
RUN apt-get update && apt-get install -y \
    # For screenshot functionality (alternative to macOS screencapture)
    scrot \
    xvfb \
    x11vnc \
    fluxbox \
    # For Sharp image processing
    libc6-dev \
    # For system automation (alternative to macOS osascript)
    xdotool \
    # General utilities
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json files for both client and server
COPY server/package.json server/package-lock.json* ./server/
COPY client/package.json client/package-lock.json* ./client/

# Install server dependencies
WORKDIR /app/server
RUN npm install

# Install client dependencies
WORKDIR /app/client
RUN npm install

# Copy source code
WORKDIR /app
COPY server/ ./server/
COPY client/ ./client/

# Build the server (TypeScript compilation)
WORKDIR /app/server
RUN npm run build

# Build the client (React build)
WORKDIR /app/client
RUN npm run build

# Set up X11 virtual display for headless screenshot functionality
ENV DISPLAY=:99

# Create startup script for X11 virtual display
RUN echo '#!/bin/bash\n\
Xvfb :99 -screen 0 1024x768x24 &\n\
fluxbox -display :99 &\n\
sleep 2\n\
cd /app/server && npm start' > /app/start.sh && chmod +x /app/start.sh

# Expose the server port
EXPOSE 3001

# Set working directory back to server for startup
WORKDIR /app/server

# Start the application
CMD ["/app/start.sh"]
