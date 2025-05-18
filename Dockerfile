FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /usr/src/app

COPY package.json ./
COPY . ./

RUN npm install --omit=dev

CMD ["node", "main.js"]
