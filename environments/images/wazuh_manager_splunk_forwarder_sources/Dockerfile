ARG SPLUNK_VERSION

FROM splunk/universalforwarder:$SPLUNK_VERSION-debian

ARG WAZUH_VERSION

USER root
# Copy entrypoint script
COPY --chown=root:root preloaded-vars.conf supervisord.conf /tmp/
COPY --chown=root:root entrypoint.sh /scripts/

RUN apt-get update -y \
    && apt-get -y install supervisor python git gnupg2 gcc make vim \
        libc6-dev libc6-dev-mips64-cross curl policycoreutils automake autoconf libtool apt-transport-https lsb-release python-cryptography \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /var/log/supervisor \
    && mv /tmp/supervisord.conf /etc/supervisor/conf.d/ \
    && cd / \
    && curl -Ls https://github.com/wazuh/wazuh/archive/$WAZUH_VERSION.tar.gz | tar zx \
    && WAZUH_TMP_INSTALLER_DIRECTORY="/$(ls | grep wazuh)" \
    && cp /tmp/preloaded-vars.conf $WAZUH_TMP_INSTALLER_DIRECTORY/etc/ \
    && $WAZUH_TMP_INSTALLER_DIRECTORY/install.sh \
    && rm -rf $WAZUH_TMP_INSTALLER_DIRECTORY \

    # && ln -s /usr/share/pyshared/lsb_release.py /usr/lib/python3.7/site-packages/lsb_release.py \

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
