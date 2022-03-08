ARG SPLUNK_VERSION

FROM splunk/universalforwarder:$SPLUNK_VERSION-debian

ARG WAZUH_VERSION

USER root

# Copy entrypoint script
COPY --chown=root:root entrypoint.sh /scripts/

RUN apt-get update -y \
    && apt-get install -y curl gnupg2 vim lsb-release \
    && curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | apt-key add - \
    && echo "deb https://packages.wazuh.com/4.x/apt/ stable main" | tee -a /etc/apt/sources.list.d/wazuh.list \
    && apt-get update -y \
    && ln -s /usr/share/pyshared/lsb_release.py /usr/lib/python3.7/site-packages/lsb_release.py \
    && apt-get install wazuh-manager=$WAZUH_VERSION -y

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
# SPLUNK_VERSION - Define the Splunk version. [SPLUNK_VERSION=8.1.1]
