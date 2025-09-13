# Use Node.js 18 LTS as the base image
FROM node:18-slim

# Install system dependencies required for the application
RUN apt-get update && apt-get install -y \
    # For debugging, to check processes
    procps \
    # For screenshot functionality (alternative to macOS screencapture)
    scrot \
    xvfb \
    x11vnc \
    # XFCE desktop environment
    xfce4 \
    xfce4-terminal \
    xfce4-goodies \
    # D-Bus for desktop functionality
    dbus-x11 \
    dbus \
    # For Sharp image processing
    libc6-dev \
    # For system automation (alternative to macOS osascript)
    xdotool \
    # General utilities
    curl \
    # Additional desktop utilities
    firefox-esr \
    thunar \
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

# Set platform environment variable for cross-platform compatibility
ENV PLATFORM=linux

# Create startup script for X11 virtual display
RUN echo '#!/bin/bash\n\
    Xvfb :99 -screen 0 1024x768x24 &\n\
    sleep 3\n\
    dbus-launch --exit-with-session &\n\
    DISPLAY=:99 startxfce4 &\n\
    sleep 5\n\
    x11vnc -display :99 -forever -nopw -listen 0.0.0.0 -xkb -verbose &\n\
    cd /app/server && npm start' > /app/start.sh && chmod +x /app/start.sh

# Expose the server port
EXPOSE 3001
# Expose VNC port for x11vnc
EXPOSE 5900

# Set working directory back to server for startup
WORKDIR /app/server

# Start the application
CMD ["/app/start.sh"]
