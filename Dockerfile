# Base Node.js stage
FROM node:18-slim AS base

# Install Python and required packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Piper in the virtual environment
RUN pip3 install --no-cache-dir piper-tts

WORKDIR /app

# Copy package files
COPY server/package*.json ./server/
COPY web/package*.json ./web/

# Install dependencies
RUN cd server && npm install
RUN cd web && npm install

# Copy the rest of the application
COPY . .

# Create necessary directories
RUN mkdir -p /app/server/src/tmp_data
RUN mkdir -p /app/server/src/generated-files/scripts

# Set environment variables
ENV NODE_ENV=development
ENV PATH="/app/node_modules/.bin:$VIRTUAL_ENV/bin:${PATH}"

# Expose ports
EXPOSE 3000
EXPOSE 3001 