# Official Playwright image includes Node.js and all Chromium OS dependencies
FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies cleanly
RUN npm ci --omit=dev

# Copy project source code
COPY . .

# Default port
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

# Start Zemo Backend
CMD ["node", "backend/server.js"]
