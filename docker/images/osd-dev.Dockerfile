# Usage: docker build --build-arg NODE_VERSION=14.20.1 --build-arg OPENSEARCH_VERSION=2.5.0 -t quay.io/wazuh/osd-dev:2.5.0 -f osd-dev.Dockerfile .

ARG NODE_VERSION
FROM node:${NODE_VERSION} AS base
ARG OPENSEARCH_VERSION
USER node
RUN git clone --depth 1 --branch ${OPENSEARCH_VERSION} https://github.com/opensearch-project/OpenSearch-Dashboards.git /home/node/kbn
RUN chown node.node /home/node/kbn

WORKDIR /home/node/kbn
RUN yarn osd bootstrap --production

WORKDIR /home/node/kbn/plugins
RUN git clone --depth 1 --branch ${OPENSEARCH_VERSION}.0 https://github.com/opensearch-project/security-dashboards-plugin.git
WORKDIR /home/node/kbn/plugins/security-dashboards-plugin
RUN yarn install

RUN yarn config set registry http://host.docker.internal:4873 && \
    sed -i 's/https:\/\/registry.yarnpkg.com/http:\/\/host.docker.internal:4873/g' yarn.lock

RUN mkdir -p /home/node/kbn/data/wazuh/config

FROM node:${NODE_VERSION}
USER node
COPY --chown=node:node --from=base /home/node/kbn /home/node/kbn
WORKDIR /home/node/kbn
