# syntax=docker/dockerfile:1

FROM node:16-alpine
WORKDIR /Angular
COPY client .
RUN npm i && npm run build

FROM node:16-alpine
WORKDIR /FlashX
ENV NODE_ENV=production PORT=8080
EXPOSE 8080
RUN npm i -g pm2@5.2.2
COPY package*.json ./
RUN npm ci && rm package-lock.json
COPY server server
COPY --from=0 Angular/dist client/dist
USER node
ENTRYPOINT [ "pm2", "start", "server/index.js", "--no-daemon" ]
