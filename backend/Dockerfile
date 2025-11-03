FROM node:22-alpine

WORKDIR /app

# System deps for building better-sqlite3 and Python packages
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    sqlite-dev \
    linux-headers \
    libffi-dev \
    libstdc++ \
    musl-dev \
    opencv-dev \
    python3-dev

# Prepare writable dirs
RUN mkdir -p /node_modules && chown node:node -R /node_modules /app

# Copy and install deps as non-root
USER node
# Note: .env file is not copied - environment variables should be set at runtime
# COPY .env /app/.env
COPY --chown=node:node package.json ./
RUN npm install

# Install Python dependencies
COPY --chown=node:node requirements.txt ./
RUN pip3 install --user --no-cache-dir -r requirements.txt

# Copy source
COPY --chown=node:node . ./

EXPOSE 3000
CMD ["node", "src/index.js"]