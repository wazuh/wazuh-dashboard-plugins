FROM node:22-alpine

# Install necessary packages
RUN apk add --no-cache \
    bash \
    docker-cli \
    docker-cli-compose \
    jq \
    tree

# Set working directory
WORKDIR /app

# Install global TypeScript tooling (no app deps here)
RUN npm install -g typescript ts-node @types/node

# Copy the wazuh-core package.json for version detection
COPY plugins/wazuh-core/package.json /workspace/plugins/wazuh-core/package.json

# Copy app manifest and install local deps (CJS-compatible chalk v4 for ts-node CommonJS)
COPY docker/osd-dev/scripts/package.json /app/package.json
RUN npm ci --omit=dev || npm install --only=prod

# Copy the TypeScript script
COPY docker/osd-dev/scripts/dev.ts ./
COPY docker/osd-dev/scripts/src ./src

# Set entrypoint
ENTRYPOINT ["ts-node", "/app/dev.ts"]
