#!/bin/bash

# Configure Wazuh server-Wazuh indexer connection
[ -n "$INDEXER_USERNAME" ] && echo "$INDEXER_USERNAME" | /var/wazuh-manager/bin/wazuh-manager-keystore -f indexer -k username
[ -n "$INDEXER_PASSWORD" ] && echo "$INDEXER_PASSWORD" | /var/wazuh-manager/bin/wazuh-manager-keystore -f indexer -k password
[ -n "$INDEXER_URL" ] && sed -i "s|<host>https://127.0.0.1:9200</host>|<host>$INDEXER_URL</host>|g" /var/wazuh-manager/etc/wazuh-manager.conf
# Resolve the user that wazuh processes run as from the installed binary
WAZUH_USER=$(stat -c '%U' /var/wazuh-manager/bin/wazuh-manager-analysisd 2>/dev/null)
WAZUH_GROUP=$(stat -c '%G' /var/wazuh-manager/bin/wazuh-manager-analysisd 2>/dev/null)
if [ -n "$INDEXER_SSL_CA" ]; then
  sed -i "s|<ca>etc/certs/root-ca.pem</ca>|<ca>$INDEXER_SSL_CA</ca>|g" /var/wazuh-manager/etc/wazuh-manager.conf
  chown "${WAZUH_USER}:${WAZUH_GROUP}" $INDEXER_SSL_CA
  chmod 400 $INDEXER_SSL_CA
fi

if [ -n "$INDEXER_SSL_CERTIFICATE" ]; then
  sed -i "s|<certificate>etc/certs/manager.pem</certificate>|<certificate>$INDEXER_SSL_CERTIFICATE</certificate>|g" /var/wazuh-manager/etc/wazuh-manager.conf
  chown "${WAZUH_USER}:${WAZUH_GROUP}" $INDEXER_SSL_CERTIFICATE
  chmod 400 $INDEXER_SSL_CERTIFICATE
fi

if [ -n "$INDEXER_SSL_CERTIFICATE_KEY" ]; then
  sed -i "s|<key>etc/certs/manager-key.pem</key>|<key>$INDEXER_SSL_CERTIFICATE_KEY</key>|g" /var/wazuh-manager/etc/wazuh-manager.conf
  chown "${WAZUH_USER}:${WAZUH_GROUP}" $INDEXER_SSL_CERTIFICATE_KEY
  chmod 400 $INDEXER_SSL_CERTIFICATE_KEY
fi

# Start service
/var/wazuh-manager/bin/wazuh-manager-control start

# Read logs file
tail -f /var/wazuh-manager/logs/wazuh-manager.log
