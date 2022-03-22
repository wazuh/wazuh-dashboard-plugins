FROM ubuntu:18.04

ARG WAZUH_VERSION
ARG FILEBEAT_VERSION
ARG FILEBEAT_WAZUH_TEMPLATE_URL
ARG FILEBEAT_WAZUH_MODULE_URL

# Copy entrypoint script
COPY --chown=root:root entrypoint.sh filebeat.yml /scripts/

# Install dependencies, Wazuh and Filebeat
RUN apt-get update -y \
    && apt-get install -y curl gnupg2 vim \
    && curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | apt-key add - \
    && echo "deb https://packages.wazuh.com/4.x/apt/ stable main" | tee -a /etc/apt/sources.list.d/wazuh.list \
    && apt-get update -y \
    && apt-get install wazuh-manager=$WAZUH_VERSION -y \
    && curl -so /tmp/filebeat-installer.deb https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-oss-$FILEBEAT_VERSION-amd64.deb  \
    && dpkg -i /tmp/filebeat-installer.deb \
    && curl -so /etc/filebeat/wazuh-template.json $FILEBEAT_WAZUH_TEMPLATE_URL \
    && curl -s $FILEBEAT_WAZUH_MODULE_URL | tar -xvz -C /usr/share/filebeat/module \
    && cp /scripts/filebeat.yml /etc/filebeat/filebeat.yml

ENTRYPOINT /scripts/entrypoint.sh

WORKDIR /var/ossec

EXPOSE 514
EXPOSE 1514
EXPOSE 1515
EXPOSE 1516
EXPOSE 55000

### Variables ###

## Arguments
# WAZUH_VERSION - Define the Wazuh version to install. [WAZUH_VERSION=4.0.2-1]
# FILEBEAT_VERSION - Filebeat Version
# FILEBEAT_WAZUH_TEMPLATE_URL - Link with the Wazuh template. [FILEBEAT_WAZUH_TEMPLATE_URL=https://raw.githubusercontent.com/wazuh/wazuh/4.0/extensions/elasticsearch/7.x/wazuh-template.json]
# FILEBEAT_WAZUH_MODULE_URL - Link with the Wazuh Filebeat module. [FILEBEAT_WAZUH_MODULE_URL=https://packages.wazuh.com/4.x/filebeat/wazuh-filebeat-0.1.tar.gz]
