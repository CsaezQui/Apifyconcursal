FROM mcr.microsoft.com/playwright:v1.52.0-jammy

# Establece el directorio de trabajo
WORKDIR /usr/src/app

# Copia los archivos necesarios
COPY . .

# Instala las dependencias de producción
RUN npm install --omit=dev

# Define el comando de arranque
CMD ["node", "main.js"]
