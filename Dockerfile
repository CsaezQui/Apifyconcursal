FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

COPY . .

CMD ["node", "main.js"]
