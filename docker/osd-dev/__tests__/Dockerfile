FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       bash \
       ca-certificates \
       curl \
       git \
       jq \
    && rm -rf /var/lib/apt/lists/*

# Install bats-core from source to ensure latest release.
RUN git clone --depth 1 https://github.com/bats-core/bats-core /tmp/bats-core \
    && /tmp/bats-core/install.sh /usr/local \
    && rm -rf /tmp/bats-core

WORKDIR /workspace/docker/osd-dev

COPY docker/osd-dev/__tests__/container-entrypoint.sh /usr/local/bin/dev-sh-tests-entrypoint
RUN chmod +x /usr/local/bin/dev-sh-tests-entrypoint

ENTRYPOINT ["/usr/local/bin/dev-sh-tests-entrypoint"]
