# Use Node.js 18 LTS as the base image
FROM node:18-slim

# Install core system dependencies (always needed for the server part)
RUN apt-get update && apt-get install -y \
    procps \
    libc6-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory for the application
WORKDIR /app

# Copy package.json files for both client and server to leverage Docker's cache
COPY package.json package-lock.json* ./
COPY server/package.json server/package-lock.json* ./server/
COPY client/package.json client/package-lock.json* ./client/
COPY shared/package.json shared/package-lock.json* ./shared/

# Install dependencies at root
RUN npm install

# Install server dependencies
# WORKDIR /app/server
# RUN npm install

# Install client dependencies
# WORKDIR /app/client
# RUN npm install

# Copy source code for both client and server
WORKDIR /app
COPY server/ ./server/
COPY client/ ./client/
COPY shared/ ./shared/

# Build the server (TypeScript compilation)
WORKDIR /app/shared
RUN npm run build

# Build the client (React build)
WORKDIR /app/client
RUN npm run build

# Build the server (TypeScript compilation)
WORKDIR /app/server
RUN npm run build

# Copy client build output to server's directory [Handled by server build]
# WORKDIR /app/server
# RUN mkdir -p client_dist && mv ../client/build ./client_dist/

# Set up X11 virtual display for headless screenshot functionality (only relevant if GUI setup is enabled)
ENV DISPLAY=:99

# Set platform environment variable for cross-platform compatibility
ENV PLATFORM=linux

# Conditionally create startup script for X11 virtual display
# This script will only be created if COMPUTER_USE_SETUP is '1'.
RUN if [ "$COMPUTER_USE_SETUP" = "1" ]; then \
    echo '#!/bin/bash\n\
    # Start system D-Bus daemon\n\
    mkdir -p /var/run/dbus\n\
    dbus-daemon --system --fork\n\
    \n\
    # Start X virtual framebuffer\n\
    Xvfb :99 -screen 0 1024x768x24 -ac &\n\
    export DISPLAY=:99\n\
    sleep 3\n\
    \n\
    # Start session D-Bus\n\
    eval $(dbus-launch --sh-syntax)\n\
    export DBUS_SESSION_BUS_ADDRESS\n\
    export DBUS_SESSION_BUS_PID\n\
    \n\
    # Start minimal XFCE components\n\
    xfce4-session --disable-tcp &\n\
    sleep 8\n\
    \n\
    # Start VNC server\n\
    x11vnc -display :99 -forever -nopw -listen 0.0.0.0 -xkb -verbose &\n\
    \n\
    # Start the application\n\
    cd /app/server && npm start' > /app/start.sh && chmod +x /app/start.sh; \
    fi

# Expose the server port
EXPOSE 3001
# Expose VNC port for x11vnc (only relevant if GUI setup is enabled)
EXPOSE 5900

# Set working directory back to server for startup
WORKDIR /app/server

# Conditionally start the application
# If COMPUTER_USE_SETUP is '1', run the script that starts GUI and then the server.
# Otherwise, just start the Node.js server directly.
CMD if [ "$COMPUTER_USE_SETUP" = "1" ]; then /app/start.sh; else npm start; fi
