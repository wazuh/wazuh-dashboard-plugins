FROM node:18-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install minimal tools
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     bash \
     ca-certificates \
     git \
  && rm -rf /var/lib/apt/lists/*

# Install test runner deps in an isolated location
WORKDIR /opt/scripts-tests
RUN npm install --no-audit --no-fund \
      jest \
      ts-jest \
      typescript \
      @types/jest \
      babel-jest \
      @babel/core \
      @babel/preset-env

# Make jest binaries available in PATH and modules resolvable
ENV PATH=/opt/scripts-tests/node_modules/.bin:$PATH
ENV NODE_PATH=/opt/scripts-tests/node_modules

# Runtime workdir mounted from host
WORKDIR /workspace/docker/osd-dev/scripts

# Entry point wrapper
COPY docker/osd-dev/scripts/__tests__/container-entrypoint.sh /usr/local/bin/script-tests-entrypoint
RUN chmod +x /usr/local/bin/script-tests-entrypoint

ENTRYPOINT ["/usr/local/bin/script-tests-entrypoint"]
