# Use pre-built base image with GUI dependencies
FROM computer-use-base:latest

WORKDIR /app

# Step 1: Build shared package
COPY shared /app/shared
WORKDIR /app/shared
RUN npm install && npm run build

# Step 2: Build computer-use-service
WORKDIR /app/computer-use-service
COPY computer-use-service/package*.json ./
RUN npm install

COPY computer-use-service/src/ ./src/
COPY computer-use-service/tsconfig.json* ./
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

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
cd /app/computer-use-service && npm start' > /app/start.sh && chmod +x /app/start.sh

# Expose application port
EXPOSE 3000

# Expose VNC port for x11vnc
EXPOSE ${VNC_PORT:-5900}

# Start the application with GUI
CMD ["/app/start.sh"]
