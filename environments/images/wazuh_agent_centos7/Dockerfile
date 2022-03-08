FROM centos:7

ARG WAZUH_VERSION

# Install dependencies
RUN rpm --import https://packages.wazuh.com/key/GPG-KEY-WAZUH \
    && echo -e "[wazuh] \n\
gpgcheck=1 \n\
gpgkey=https://packages.wazuh.com/key/GPG-KEY-WAZUH \n\
enabled=1 \n\
name=EL-$releasever - Wazuh \n\
baseurl=https://packages.wazuh.com/4.x/yum/ \n\
protect=1 \n\
        " >> /etc/yum.repos.d/wazuh.repo \
    && cat /etc/yum.repos.d/wazuh.repo \
    && yum install -y wazuh-agent-$WAZUH_VERSION

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