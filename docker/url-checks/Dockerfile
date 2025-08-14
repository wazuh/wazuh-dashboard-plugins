# Multi-stage Dockerfile for URL checks
# Stage 1: Extract URLs using Node.js
FROM node:20-alpine AS url-extractor

WORKDIR /app

# Install global dependencies
RUN npm install -g tsx typescript --no-package-lock

# Copy the entire repository
COPY . .

# This step aims to obtain all URLs throughout the entire repository, filtering out those that correspond to examples (such as `example.org`, `sampledata`, `cors-anywhere`, among others). These URLs are excluded because they often generate errors or are simply fictitious addresses used as references.
RUN apk add --no-cache git ripgrep && \
  # ripgrep only uses .gitignore if it detects a Git repo.
  # Running `git init` (and/or installing Git) allows rg to apply the .gitignore rules automatically.
  git init && \
  # https://stackoverflow.com/a/3809435
  rg --pcre2 -o 'https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)[\$]?' \
  plugins/ --glob '!package-lock.json' --glob '!package.json' --glob '!yarn.lock' --glob '!*.test.*' \
  | grep -vE '(\$[{(]?|github.com|github.io|stackoverflow|foo\.org|env-[0-9]\.example|localhost|w3\.org|sample-data|kibana\:|[a-z]+\:[0-9]+|cors-anywhere\.herokuapp\.com)|endpoints.json' > links.txt

# Extract URLs
RUN tsx scripts/url-checks/extractor.ts

# Stage 2: Check Doc URLs using Lychee
FROM lycheeverse/lychee:latest AS url-doc-checker

WORKDIR /app

# Copy extracted URLs from previous stage
COPY --from=url-extractor /app/scripts/url-checks/extracted-urls.md /app/extracted-urls.md

# Default command to check URLs
CMD ["--verbose", "--max-redirects", "0", "--format", "detailed", "--no-progress", "extracted-urls.md"]

# Stage 3: Check URLs using Lychee
FROM lycheeverse/lychee:latest AS url-checker

WORKDIR /app

# Copy extracted URLs from previous stage
COPY --from=url-extractor /app/links.txt /app/links.txt

# Default command to check URLs
CMD ["--verbose", "--format", "detailed", "--no-progress", "links.txt"]
