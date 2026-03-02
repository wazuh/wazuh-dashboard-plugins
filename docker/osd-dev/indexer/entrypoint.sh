#!/bin/bash

INDEXER_HOME=/usr/share/wazuh-indexer

# Change permissions
chown -R wazuh-indexer:wazuh-indexer /etc/wazuh-indexer
chown -R wazuh-indexer:wazuh-indexer /etc/wazuh-indexer/certs
chown -R wazuh-indexer:wazuh-indexer /var/lib/os1

if [ -x "$INDEXER_HOME/engine/run_engine.sh" ]; then
  nohup "$INDEXER_HOME/engine/run_engine.sh" > /dev/null 2>&1 &
  echo $! > /run/wazuh-indexer/wazuh-engine.pid

  ENGINE_API_SOCK="$INDEXER_HOME/engine/sockets/engine-api.sock"
  (
    while [ ! -S "$ENGINE_API_SOCK" ]; do
      sleep 3
    done
    chmod 777 "$ENGINE_API_SOCK"
  ) &
fi

# Start service
runuser wazuh-indexer --shell=/bin/bash --command=$INDEXER_HOME/bin/opensearch
