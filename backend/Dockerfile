FROM node:22-alpine

WORKDIR /app

# System deps for building better-sqlite3
RUN apk add --no-cache python3 make g++ sqlite-dev

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