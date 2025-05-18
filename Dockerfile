FROM mcr.microsoft.com/playwright:v1.52.0-jammy

# Copiamos todos los archivos al contenedor
COPY . ./

# Instalamos las dependencias necesarias (solo producción)
RUN npm install --omit=dev

# Comando por defecto
CMD ["node", "main.js"]
