FROM node:24.18-alpine3.24

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . . 

EXPOSE 3001

CMD ["npm", "run", "start:dev"]