FROM apify/actor-node:20

COPY . ./

RUN npm install --omit=dev

CMD ["node", "main.js"]
