# Multi-stage Dockerfile for URL checks
# Stage 1: Extract URLs using Node.js
FROM node:20-alpine AS url-extractor

WORKDIR /app

# Install global dependencies
RUN npm install -g tsx typescript --no-package-lock

# Copy the entire repository
COPY . .

# This step aims to obtain all URLs throughout the entire repository, filtering out those that correspond to examples (such as `example.org`, `sampledata`, `cors-anywhere`, among others). These URLs are excluded because they often generate errors or are simply fictitious addresses used as references.
# For now, this step is commented out, as I couldn't properly configure the **Lychee** tool, which is a link checker. The problem is that Lychee, instead of just verifying the validity of each URL, accesses them and recursively analyzes all the links it finds within, which is not the desired behavior in this case. I have not yet found a way to limit it so that it only verifies the URL directly without following internal links.

# RUN apk add --no-cache ripgrep && rg -o 'https?://[^\s"'"'"'<>()]+' plugins/ --glob '!package-lock.json' --glob '!yarn.lock' --glob '!*.test.*' | grep -vE '(\$[{(]?|github.com|github.io|stackoverflow|foo\.org|env-[0-9]\.example|localhost|w3\.org|sample-data|kibana\:|[a-z]+\:[0-9]+|cors-anywhere\.herokuapp\.com)' > links.txt

# Extract URLs
RUN tsx scripts/url-checks/extractor.ts

# Stage 2: Check URLs using Lychee
FROM lycheeverse/lychee:latest AS url-doc-checker

WORKDIR /app

# Copy extracted URLs from previous stage
COPY --from=url-extractor /app/scripts/url-checks/extracted-urls.md /app/extracted-urls.md

# Default command to check URLs
CMD ["--verbose", "--max-redirects", "0", "--format", "detailed", "--no-progress", "extracted-urls.md"]
