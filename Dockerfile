FROM apify/actor-node:20

ENV PLAYWRIGHT_BROWSERS_PATH=0

COPY . ./

RUN npm install --omit=dev && npx playwright install chromium

CMD ["node", "main.js"]