FROM node:24.18-alpine3.2

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . . 

EXPOSE 3000

CMD ["npm", "run", "start:dev"]