FROM ubuntu:24.04

ADD --chown=root:root installer.sh /installer/installer.sh
ADD wazuh-indexer*.deb /installer/wazuh-indexer.deb
ADD --chown=root:root entrypoint.sh /entrypoint.sh

RUN bash /installer/installer.sh && chmod +x /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
