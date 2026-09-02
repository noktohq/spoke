FROM node:22-slim
WORKDIR /srv
COPY engine/ engine/
COPY server/ server/
ENV NODE_ENV=production
USER node
CMD ["node", "server/src/index.js"]
