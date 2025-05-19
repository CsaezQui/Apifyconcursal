# Usa la imagen oficial de Playwright con Chromium
FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /usr/src/app

# Copia sólo package.json y package-lock.json para caché de dependencias
COPY package.json package-lock.json* ./

# Instala dependencias de producción
RUN npm ci --omit=dev

# Copia el resto del código
COPY . .

# Comando por defecto
CMD ["npm", "start"]
