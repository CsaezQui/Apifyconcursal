FROM apify/actor-node:20

ENV PUPPETEER_SKIP_DOWNLOAD=false

COPY . ./

RUN rm -rf node_modules \
    && npm install --omit=dev \
    && node node_modules/puppeteer/install.mjs

CMD ["node", "main.js"]
