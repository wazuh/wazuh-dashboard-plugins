FROM ubuntu:24.04

ADD --chown=root:root installer.sh /installer/installer.sh
ADD wazuh-manager*.deb /installer/wazuh-manager.deb
ADD --chown=root:root entrypoint.sh /entrypoint.sh

RUN bash /installer/installer.sh && chmod +x /entrypoint.sh

# Certificate tool and its node inventory, used by the entrypoint to issue the
# agent-facing listener certificate. Added after the install so editing them
# does not invalidate the package layer.
ADD --chown=root:root wazuh-certs-tool.sh /usr/share/wazuh-certs-tool/wazuh-certs-tool.sh
ADD --chown=root:root wazuh-certs.yml /etc/wazuh-certs.yml

ENTRYPOINT [ "/entrypoint.sh" ]
