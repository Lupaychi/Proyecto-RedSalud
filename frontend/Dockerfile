FROM node:20 as build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20

WORKDIR /app

COPY --from=build /app/dist/frontend/browser /app/dist
RUN npm install -g http-server

EXPOSE 4200

CMD ["http-server", "dist", "-p", "4200", "-c-1"]