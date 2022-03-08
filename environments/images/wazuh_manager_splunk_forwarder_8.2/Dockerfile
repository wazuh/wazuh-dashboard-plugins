FROM ubuntu:18.04

ARG WAZUH_VERSION
ARG SPLUNK_VERSION

USER root
# Copy entrypoint script
COPY --chown=root:root preloaded-vars.conf supervisord.conf /tmp/
COPY --chown=root:root entrypoint.sh /scripts/

WORKDIR /

RUN apt-get update -y \
    && apt-get install -y apt-transport-https ca-certificates gnupg software-properties-common wget \
    && wget -O - https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null | apt-key add - \
    && apt-add-repository 'deb https://apt.kitware.com/ubuntu/ bionic main' 

RUN apt-get update -y \
    && apt-get -y install supervisor python git gnupg2 gcc make vim cmake build-essential \
        libc6-dev libc6-dev-mips64-cross curl policycoreutils automake autoconf libtool apt-transport-https lsb-release python-cryptography \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /var/log/supervisor \
    && mv /tmp/supervisord.conf /etc/supervisor/conf.d/ \
    && cd / \
    && curl -Ls https://github.com/wazuh/wazuh/archive/$WAZUH_VERSION.tar.gz | tar zx \
    && WAZUH_TMP_INSTALLER_DIRECTORY="/$(ls | grep wazuh)" \
    && cp /tmp/preloaded-vars.conf $WAZUH_TMP_INSTALLER_DIRECTORY/etc/ \
    && $WAZUH_TMP_INSTALLER_DIRECTORY/install.sh \
    && rm -rf $WAZUH_TMP_INSTALLER_DIRECTORY 

#Install Splunk Forwarder
RUN echo "${SPLUNK_VERSION}"
RUN cd && wget -O splunkforwarder.deb "https://download.splunk.com/products/universalforwarder/releases/8.2.2.1/linux/splunkforwarder-8.2.2.1-ae6821b7c64b-linux-2.6-amd64.deb" \
    && dpkg --install ./splunkforwarder.deb 
 
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
