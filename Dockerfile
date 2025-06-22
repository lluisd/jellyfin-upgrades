FROM node:22-alpine

RUN apk upgrade --no-cache

RUN apk add --no-cache \
    bash

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY . .

RUN npm install

ENV DB_DIR=/usr/src/app/data
RUN mkdir -p $DB_DIR && chown -R node:node $DB_DIR
VOLUME ["/usr/src/app/data"]

USER node

EXPOSE 3000

CMD npm start
