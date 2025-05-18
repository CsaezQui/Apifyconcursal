FROM apify/actor-node-playwright:16

# Copiamos todos los archivos al contenedor
COPY . ./

# Instalamos las dependencias necesarias
RUN npm install --omit=dev

# Comando por defecto
CMD ["node", "main.js"]