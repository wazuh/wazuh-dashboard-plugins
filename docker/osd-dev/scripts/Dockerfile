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

# Install TypeScript dependencies
RUN npm install -g typescript ts-node @types/node

# Copy the wazuh-core package.json for version detection
COPY plugins/wazuh-core/package.json /workspace/plugins/wazuh-core/package.json

# Copy the TypeScript script
COPY docker/osd-dev/scripts/dev.ts ./
COPY docker/osd-dev/scripts/src ./src

# Set entrypoint
ENTRYPOINT ["ts-node", "/app/dev.ts"]
