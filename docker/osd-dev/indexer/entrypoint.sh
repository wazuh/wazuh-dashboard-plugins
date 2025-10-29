#!/bin/bash

# Change permissions
chown -R wazuh-indexer:wazuh-indexer /etc/wazuh-indexer
chown -R wazuh-indexer:wazuh-indexer /etc/wazuh-indexer/certs
chown -R wazuh-indexer:wazuh-indexer /var/lib/os1

# Start service
runuser wazuh-indexer --shell=/bin/bash --command=/usr/share/wazuh-indexer/bin/opensearch
