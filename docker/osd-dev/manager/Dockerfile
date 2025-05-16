FROM ubuntu:24.04

ARG WAZUH_VERSION_FILEBEAT
ARG WAZUH_VERSION_DEVELOPMENT

ENV WAZUH_VERSION_FILEBEAT=${WAZUH_VERSION_FILEBEAT}
ENV WAZUH_VERSION_DEVELOPMENT=${WAZUH_VERSION_DEVELOPMENT}

ADD --chown=root:root installer.sh /installer/installer.sh
ADD wazuh-manager*.deb /installer/wazuh-manager.deb
ADD --chown=root:root entrypoint.sh /entrypoint.sh

RUN bash /installer/installer.sh && chmod +x /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
