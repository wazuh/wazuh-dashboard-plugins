FROM ubuntu:24.04

ADD --chown=root:root installer.sh /installer/installer.sh
ADD wazuh-manager*.deb /installer/wazuh-manager.deb
ADD --chown=root:root entrypoint.sh /entrypoint.sh

RUN bash /installer/installer.sh && chmod +x /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
