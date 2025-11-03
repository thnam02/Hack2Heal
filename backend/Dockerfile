FROM node:22-slim

WORKDIR /app

# Install system dependencies for better-sqlite3 and Python packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    sqlite3 \
    libsqlite3-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies as root (needed for system-wide packages)
COPY requirements.txt ./
RUN pip3 install --break-system-packages --no-cache-dir -r requirements.txt && rm requirements.txt

# Prepare writable dirs
RUN mkdir -p /node_modules && chown node:node -R /node_modules /app

# Copy and install deps as non-root
USER node
# Note: .env file is not copied - environment variables should be set at runtime
# COPY .env /app/.env
COPY --chown=node:node package.json ./
RUN npm install

# Copy source
COPY --chown=node:node . ./

EXPOSE 3000
CMD ["node", "src/index.js"]