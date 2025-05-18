FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

CMD ["node", "main.js"]
