FROM apify/actor-node:20

ENV PUPPETEER_SKIP_DOWNLOAD=false

COPY . ./

# Fuerza la instalación y la descarga de Chromium
RUN rm -rf node_modules && npm install --omit=dev && node node_modules/puppeteer/install.js

CMD ["node", "main.js"]
