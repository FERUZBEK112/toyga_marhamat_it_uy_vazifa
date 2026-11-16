FROM node:24-alpine
WORKDIR /app
COPY package.json server.mjs event.json index.html style.css app.js hero.jpg gallery-1.jpg gallery-2.jpg gallery-3.jpg favicon.svg ./
ENV NODE_ENV=production DATA_DIR=/data
EXPOSE 3000
CMD ["node", "server.mjs"]
