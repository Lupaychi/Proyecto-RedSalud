FROM node:20

WORKDIR /app

COPY package.json ./
RUN npm install
RUN npm install -g wait-port

COPY . .

EXPOSE 3001

CMD wait-port mysql:3306 && node index.js