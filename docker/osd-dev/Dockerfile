ARG BASE_IMAGE=node:20-bookworm-slim
FROM ${BASE_IMAGE}

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      git \
      build-essential \
      python3 \
      python3-pip \
      ca-certificates \
      curl \
      procps \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/kbn

USER node

CMD ["tail", "-f", "/dev/null"]
