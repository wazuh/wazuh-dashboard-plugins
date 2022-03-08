FROM ubuntu:20.04

ARG WAZUH_VERSION

# Install dependencies
RUN apt-get update -y \
    && apt-get install -y curl gnupg2 vim \
    && curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | apt-key add - \
    && echo "deb https://packages.wazuh.com/4.x/apt/ stable main" | tee -a /etc/apt/sources.list.d/wazuh.list \
    && apt-get update -y \
    && apt-get install wazuh-agent=$WAZUH_VERSION -y \
    && rm -rf /var/lib/apt/lists/*

# Copy entrypoint script
COPY --chown=root:root entrypoint.sh /scripts/entrypoint.sh

WORKDIR /var/ossec

ENTRYPOINT /scripts/entrypoint.sh

### Variables ###

## Arguments
# WAZUH_VERSION = Define the Wazuh version to install. [WAZUH_VERSION=4.0.2-1]

## Environment
# JOIN_MANAGER - Manager IP/Domain. [JOIN_MANAGER=172.17.1.2]
# JOIN_GROUPS - Groups to add the agent. [JOIN_GROUPS=default]
# JOIN_PASSWORD - Password to register. [JOIN_PASSWORD=password]