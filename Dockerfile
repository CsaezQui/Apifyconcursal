FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /usr/src/app

# Copiamos package.json e instalamos dependencias (npm install en lugar de npm ci)
COPY package.json ./
RUN npm install --omit=dev

# Copiamos el resto
COPY . .

CMD ["npm", "start"]
