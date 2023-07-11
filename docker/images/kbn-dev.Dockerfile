# Usage: docker build --build-arg NODE_VERSION=16.17.1 --build-arg KIBANA_VERSION=7.17.7 -t quay.io/wazuh/kbn-dev:7.17.7 -f kbn-dev.Dockerfile .

ARG NODE_VERSION
FROM node:${NODE_VERSION} AS base
RUN npm install --global @bazel/bazelisk@1.11.0
ARG KIBANA_VERSION
USER node
RUN git clone --depth 1 --branch v${KIBANA_VERSION} https://github.com/elastic/kibana /home/node/kbn
RUN chown node.node /home/node/kbn

WORKDIR /home/node/kbn
RUN yarn kbn bootstrap
RUN yarn config set registry http://host.docker.internal:4873 && \
    sed -i 's/https:\/\/registry.yarnpkg.com/http:\/\/host.docker.internal:4873/g' yarn.lock
RUN rm -rf /home/node/.cache/yarn && rm -rf /home/node/.cache/Cypress && rm -rf /home/node/.cache/ms-playwright
RUN mkdir -p /home/node/kbn/data/wazuh/config

FROM node:${NODE_VERSION}
USER node
COPY --from=base /home/node/ /home/node/
WORKDIR /home/node/kbn

