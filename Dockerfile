FROM apify/actor-node:20

# Ensure Playwright browsers are installed
ENV PLAYWRIGHT_BROWSERS_PATH=0

COPY . ./

RUN npm install --omit=dev && npx playwright install chromium

CMD ["node", "main.js"]
