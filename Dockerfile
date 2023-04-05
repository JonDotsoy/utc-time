FROM node:19-alpine

WORKDIR /app
COPY . /app

ENV PORT=3000
EXPOSE 3000

RUN npm i
RUN npm run build

CMD [ "npm", "start" ]
