# Usamos la imagen oficial de Playwright con Chromium incluido
FROM mcr.microsoft.com/playwright:v1.52.0-jammy

# Directorio de la aplicación
WORKDIR /usr/src/app

# Copiamos definición de dependencias e instalamos
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copiamos el resto del código
COPY . .

# Comando por defecto al arrancar el contenedor
CMD ["node", "main.js"]
