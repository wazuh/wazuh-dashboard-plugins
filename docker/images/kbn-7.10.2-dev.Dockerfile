FROM node:10.23.1 AS builder-kbn-7.10.2
RUN npm install --global @bazel/bazelisk@1.11.0
USER node
RUN git clone --depth 1 --branch v7.10.2 https://github.com/elastic/kibana /home/node/kbn
RUN chown node.node /home/node/kbn

WORKDIR /home/node/kbn
RUN yarn kbn bootstrap
RUN yarn config set registry http://host.docker.internal:4873 && \
    sed -i 's/https:\/\/registry.yarnpkg.com/http:\/\/host.docker.internal:4873/g' yarn.lock
RUN rm -rf /home/node/.cache/yarn && rm -rf /home/node/.cache/Cypress && rm -rf /home/node/.cache/ms-playwright
RUN mkdir -p /home/node/kbn/data/wazuh/config

FROM node:10.23.1
USER node
COPY --from=builder-kbn-7.10.2 /home/node/ /home/node/
WORKDIR /home/node/kbn
