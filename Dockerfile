FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /usr/src/app
COPY . .

RUN npm install

CMD ["node", "main.js"]
