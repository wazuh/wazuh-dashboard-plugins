#!/bin/bash

INDEXER_HOME=/usr/share/wazuh-indexer
CERTS_DIR=/etc/wazuh-indexer/certs
SECURITY_CONF=/etc/wazuh-indexer/opensearch-security

# Change permissions
chown -R wazuh-indexer:wazuh-indexer /etc/wazuh-indexer
chown -R wazuh-indexer:wazuh-indexer /etc/wazuh-indexer/certs
chown -R wazuh-indexer:wazuh-indexer /var/lib/wazuh-indexer
chown -R wazuh-indexer:wazuh-indexer /var/log/wazuh-indexer

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

# Start service in background
runuser wazuh-indexer --shell=/bin/bash --command="$INDEXER_HOME/bin/opensearch" &
OPENSEARCH_PID=$!

# Wait for OpenSearch to be reachable (503 = starting, 401 = ready)
echo "Waiting for OpenSearch to be reachable..."
until curl -sk --cacert "$CERTS_DIR/root-ca.pem" \
    https://wazuh.indexer:9200 -o /dev/null -w "%{http_code}" \
    2>/dev/null | grep -qE "401|503"; do
  sleep 2
done

echo "OpenSearch is reachable. Initializing security..."
export JAVA_HOME="$INDEXER_HOME/jdk"
"$INDEXER_HOME/plugins/opensearch-security/tools/securityadmin.sh" \
  -cd "$SECURITY_CONF" \
  -icl -nhnv \
  -cacert "$CERTS_DIR/root-ca.pem" \
  -cert "$CERTS_DIR/admin.pem" \
  -key "$CERTS_DIR/admin-key.pem" \
  -h wazuh.indexer \
  -p 9200

echo "Security initialization done."

# Keep container alive
wait $OPENSEARCH_PID
