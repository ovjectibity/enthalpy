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
    xfce4-session \
    xfce4-panel \
    xfce4-terminal \
    xfwm4 \
    xfdesktop4 \
    xfce4-settings \
    # D-Bus system and session
    dbus \
    dbus-x11 \
    # Minimal system services
    systemd \
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

# Create minimal XFCE configuration to disable unnecessary services
RUN mkdir -p /etc/xdg/autostart && \
    # Disable power manager
    echo "[Desktop Entry]\nHidden=true" > /etc/xdg/autostart/xfce4-power-manager.desktop && \
    # Disable light locker
    echo "[Desktop Entry]\nHidden=true" > /etc/xdg/autostart/light-locker.desktop && \
    # Disable polkit agent
    echo "[Desktop Entry]\nHidden=true" > /etc/xdg/autostart/polkit-gnome-authentication-agent-1.desktop && \
    # Disable color daemon
    echo "[Desktop Entry]\nHidden=true" > /etc/xdg/autostart/xiccd.desktop

# Create startup script for X11 virtual display
RUN echo '#!/bin/bash\n\
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
    cd /app/server && npm start' > /app/start.sh && chmod +x /app/start.sh

# Expose the server port
EXPOSE 3001
# Expose VNC port for x11vnc
EXPOSE 5900

# Set working directory back to server for startup
WORKDIR /app/server

# Start the application
CMD ["/app/start.sh"]
