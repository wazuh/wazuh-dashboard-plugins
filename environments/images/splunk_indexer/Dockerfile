FROM ubuntu:18.04

ARG SPLUNK_INDEXER_URL
ARG SPLUNK_INDEXER_INDEXES_CONF_URL
ARG SPLUNK_INDEXER_INPUTS_CONF_URL

# Copy entrypoint script
COPY entrypoint.sh user-seed.conf /scripts/

# Install dependencies, Wazuh and Filebeat
RUN apt-get update -y \
    && apt-get install -y curl gnupg2 vim wget \
    && wget -O splunk.deb $SPLUNK_INDEXER_URL \
    && dpkg --install splunk.deb \
    && touch /opt/splunk/etc/system/local/user-seed.conf \
    && mv /scripts/user-seed.conf /opt/splunk/etc/system/local/user-seed.conf \
    && curl -so /opt/splunk/etc/system/local/indexes.conf $SPLUNK_INDEXER_INDEXES_CONF_URL \
    && curl -so /opt/splunk/etc/system/local/inputs.conf $SPLUNK_INDEXER_INPUTS_CONF_URL \
    && echo "OPTIMISTIC_ABOUT_FILE_LOCKING = 1" >> /opt/splunk/etc/splunk-launch.conf

ENTRYPOINT /scripts/entrypoint.sh

WORKDIR /opt/splunk

EXPOSE 8000
EXPOSE 8089

VOLUME /opt/splunk/etc/apps/

### Variables ###

## Arguments
# SPLUNK_INDEXER_URL - Splunk indexer package url. [SPLUNK_INDEXER_URL=https://www.splunk.com/bin/splunk/DownloadActivityServlet?architecture=x86_64&platform=linux&version=8.1.1&product=splunk&filename=splunk-8.1.1-08187535c166-linux-2.6-amd64.deb&wget=true]
# SPLUNK_INDEXER_INDEXES_CONF_URL - indexes.conf url. [SPLUNK_INDEXER_INDEXES_CONF_URL=https://raw.githubusercontent.com/wazuh/wazuh/v3.13.2/extensions/splunk/peer-indexes.conf]
# SPLUNK_INDEXER_INPUTS_CONF_URL - inputs.conf url. [SPLUNK_INDEXER_INPUTS_CONF_URL=https://raw.githubusercontent.com/wazuh/wazuh/v3.13.2/extensions/splunk/peer-inputs.conf]
