FROM apify/actor-node:20

COPY . ./

RUN rm -rf node_modules && npm install --omit=dev

CMD ["node", "main.js"]
