FROM ubuntu:18.04

ARG WAZUH_VERSION
ARG SPLUNK_FORWARDER_URL
ARG SPLUNK_FORWARDER_PROPS_CONF_URL
ARG SPLUNK_FORWARDER_INPUTS_CONF_URL

# Copy entrypoint script
COPY --chown=root:root entrypoint.sh user-seed.conf /scripts/

# Install dependencies, Wazuh and Filebeat
RUN apt-get update -y \
    && apt-get install -y curl gnupg2 vim wget \
    && curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | apt-key add - \
    && echo "deb https://packages.wazuh.com/4.x/apt/ stable main" | tee -a /etc/apt/sources.list.d/wazuh.list \
    && apt-get update -y \
    && apt-get install wazuh-manager=$WAZUH_VERSION -y \
    && wget -O splunkforwarder.deb $SPLUNK_FORWARDER_URL \
    && dpkg --install splunkforwarder.deb \
    && touch /opt/splunkforwarder/etc/system/local/user-seed.conf \
    && mv /scripts/user-seed.conf /opt/splunkforwarder/etc/system/local/user-seed.conf \
    && curl -so /opt/splunkforwarder/etc/system/local/props.conf $SPLUNK_FORWARDER_PROPS_CONF_URL \
    && curl -so /opt/splunkforwarder/etc/system/local/inputs.conf $SPLUNK_FORWARDER_INPUTS_CONF_URL \
    && sed -i "s:MANAGER_HOSTNAME:$(hostname):g" /opt/splunkforwarder/etc/system/local/inputs.conf \
    && /opt/splunkforwarder/bin/splunk start --accept-license --answer-yes --auto-ports --no-prompt

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
# SPLUNK_FORWARDER_URL - Link with the Wazuh template. [SPLUNK_FORWARDER_URL=https://www.splunk.com/bin/splunk/DownloadActivityServlet?architecture=x86_64&platform=linux&version=8.1.1&product=universalforwarder&filename=splunkforwarder-8.1.1-08187535c166-linux-2.6-amd64.deb&wget=true]
# SPLUNK_FORWARDER_PROPS_CONF_URL - Link with the Wazuh template. [SPLUNK_FORWARDER_PROPS_CONF_URL=https://raw.githubusercontent.com/wazuh/wazuh/v3.13.2/extensions/splunk/props.conf]
# SPLUNK_FORWARDER_INPUTS_CONF_URL - Link with the Wazuh template. [SPLUNK_FORWARDER_INPUTS_CONF_URL=https://raw.githubusercontent.com/wazuh/wazuh/v3.13.2/extensions/splunk/inputs.conf]
