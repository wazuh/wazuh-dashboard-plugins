# Usage: docker build --build-arg NODE_VERSION=16.20.0 --build-arg WAZUH_DASHBOARD_VERSION=4.6.0 -t quay.io/wazuh/osd-dev:4.6.0 -f wzd-dev.Dockerfile .

ARG NODE_VERSION
FROM node:${NODE_VERSION} AS base
ARG WAZUH_DASHBOARD_VERSION
USER node
RUN git clone --depth 1 --branch ${WAZUH_DASHBOARD_VERSION} https://github.com/wazuh/wazuh-dashboard.git /home/node/kbn
RUN chown node.node /home/node/kbn

WORKDIR /home/node/kbn
RUN yarn osd bootstrap --production


WORKDIR /home/node/kbn/plugins
RUN git clone --depth 1 --branch ${WAZUH_DASHBOARD_VERSION} https://github.com/wazuh/wazuh-security-dashboards-plugin.git
WORKDIR /home/node/kbn/plugins/wazuh-security-dashboards-plugin
RUN yarn install

RUN mkdir -p /home/node/kbn/data/wazuh/config

FROM node:${NODE_VERSION}
USER node
COPY --chown=node:node --from=base /home/node/kbn /home/node/kbn
WORKDIR /home/node/kbn
