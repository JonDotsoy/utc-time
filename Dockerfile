FROM node:19-alpine as BUILD

WORKDIR /app
COPY . /app

RUN npm i
RUN npm run build
RUN mv $(npm pack) /app.tgz

FROM node:19-alpine AS CLEAN

WORKDIR /app
COPY --from=BUILD /app.tgz /app.tgz
COPY next.config.js next.config.js

ENV PORT=3000
EXPOSE 3000

RUN npm i /app.tgz --omit peer --omit optional --omit dev
RUN rm /app.tgz

FROM node:19-alpine

WORKDIR /app
COPY --from=CLEAN /app /app

CMD [ "npx", "next", "start", "node_modules/utc-time" ]
