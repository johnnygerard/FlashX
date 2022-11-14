# syntax=docker/dockerfile:1

FROM node:16-alpine AS client
WORKDIR /FlashX
COPY client client
RUN cd client && npm ci && npm run build

FROM node:16-alpine AS server
WORKDIR /FlashX
COPY server server
RUN cd server && npm ci && npm run build

FROM node:16-alpine AS FlashX
WORKDIR /home/node
ENV NODE_ENV=production PORT=8080
EXPOSE 8080
RUN npm i -g pm2@5.2.2
COPY --from=client FlashX/client/dist .
COPY --from=server FlashX/server/dist FlashX/server/node_modules ./
RUN echo '{"type":"module"}' | cat >server/package.json
USER node
ENTRYPOINT [ "pm2", "start", "server/index.js", "--no-daemon" ]
