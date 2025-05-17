FROM apify/actor-node:20

ENV PUPPETEER_SKIP_DOWNLOAD=false

COPY . ./

RUN npm install --omit=dev

CMD ["node", "main.js"]
