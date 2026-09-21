FROM node:24.18-alpine3.24

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma generate && npm run start:dev"]
