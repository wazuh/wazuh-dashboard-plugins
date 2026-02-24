#!/bin/bash

# Configure Wazuh server-Wazuh indexer connection
[ -n "$INDEXER_USERNAME" ] && echo "$INDEXER_USERNAME" | /var/wazuh-manager/bin/wazuh-keystore -f indexer -k username
[ -n "$INDEXER_PASSWORD" ] && echo "$INDEXER_PASSWORD" | /var/wazuh-manager/bin/wazuh-keystore -f indexer -k password
[ -n "$INDEXER_URL" ] && sed -i "s|<host>https://127.0.0.1:9200</host>|<host>$INDEXER_URL</host>|g" /var/wazuh-manager/etc/wazuh-manager.conf
if [ -n "$INDEXER_SSL_CA" ]; then
  sed -i "s|<ca>/var/wazuh-manager/etc/certs/root-ca.pem</ca>|<ca>$INDEXER_SSL_CA</ca>|g" /var/wazuh-manager/etc/wazuh-manager.conf
  chmod 400 $INDEXER_SSL_CA
  chown root:root $INDEXER_SSL_CA
fi

if [ -n "$INDEXER_SSL_CERTIFICATE" ]; then
  sed -i "s|<certificate>/var/wazuh-manager/etc/certs/server.pem</certificate>|<certificate>$INDEXER_SSL_CERTIFICATE</certificate>|g" /var/wazuh-manager/etc/wazuh-manager.conf
  chmod 400 $INDEXER_SSL_CERTIFICATE
  chown root:root $INDEXER_SSL_CERTIFICATE
fi

if [ -n "$INDEXER_SSL_CERTIFICATE_KEY" ]; then
  sed -i "s|<key>/var/wazuh-manager/etc/certs/server-key.pem</key>|<key>$INDEXER_SSL_CERTIFICATE_KEY</key>|g" /var/wazuh-manager/etc/wazuh-manager.conf
  chmod 400 $INDEXER_SSL_CERTIFICATE_KEY
  chown root:root $INDEXER_SSL_CERTIFICATE_KEY
fi

# Start service
/var/wazuh-manager/bin/wazuh-control start

# Read logs file
tail -f /var/wazuh-manager/logs/wazuh-manager.log
