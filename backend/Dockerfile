FROM node:22-alpine

WORKDIR /app

RUN mkdir -p /node_modules && chown node:node -R /node_modules /app
RUN npm install -g pm2

USER node
COPY .env /app/.env
COPY --chown=node:node package.json ./

RUN npm install

COPY --chown=node:node . ./

EXPOSE 3000