FROM node:18.16.1-alpine as ts-compiler
WORKDIR /usr/app
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm install 
COPY . .
RUN npm run build

FROM node:18.16.1-alpine as ts-remover
WORKDIR /usr/app
COPY --from=ts-compiler /usr/app/package*.json ./
COPY --from=ts-compiler /usr/app/dist ./dist
RUN npm install --only=production

FROM node:18.16.1-alpine
WORKDIR /usr/app
COPY --from=ts-remover /usr/app/dist ./dist
CMD ["node", "dist/index.js"]