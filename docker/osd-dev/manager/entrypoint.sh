#!/bin/bash

# Configure Wazuh server-Wazuh indexer connection
[ -n "$INDEXER_USERNAME" ] && echo "$INDEXER_USERNAME" | /var/wazuh-manager/bin/wazuh-manager-keystore -f indexer -k username
[ -n "$INDEXER_PASSWORD" ] && echo "$INDEXER_PASSWORD" | /var/wazuh-manager/bin/wazuh-manager-keystore -f indexer -k password
[ -n "$INDEXER_URL" ] && sed -i "/<indexer>/,/<\/indexer>/ s|<host>[^<]*</host>|<host>$INDEXER_URL</host>|g" /var/wazuh-manager/etc/wazuh-manager.conf
WAZUH_USER_AND_GROUP="wazuh-manager:wazuh-manager"
if [ -n "$INDEXER_SSL_CA" ]; then
  sed -i "/<indexer>/,/<\/indexer>/ s|<ca>[^<]*</ca>|<ca>$INDEXER_SSL_CA</ca>|g" /var/wazuh-manager/etc/wazuh-manager.conf
  chown "$WAZUH_USER_AND_GROUP" $INDEXER_SSL_CA
  chmod 400 $INDEXER_SSL_CA
fi

if [ -n "$INDEXER_SSL_CERTIFICATE" ]; then
  sed -i "/<indexer>/,/<\/indexer>/ s|<certificate>[^<]*</certificate>|<certificate>$INDEXER_SSL_CERTIFICATE</certificate>|g" /var/wazuh-manager/etc/wazuh-manager.conf
  chown "$WAZUH_USER_AND_GROUP" $INDEXER_SSL_CERTIFICATE
  chmod 400 $INDEXER_SSL_CERTIFICATE
fi

if [ -n "$INDEXER_SSL_CERTIFICATE_KEY" ]; then
  sed -i "/<indexer>/,/<\/indexer>/ s|<key>[^<]*</key>|<key>$INDEXER_SSL_CERTIFICATE_KEY</key>|g" /var/wazuh-manager/etc/wazuh-manager.conf
  chown "$WAZUH_USER_AND_GROUP" $INDEXER_SSL_CERTIFICATE_KEY
  chmod 400 $INDEXER_SSL_CERTIFICATE_KEY
fi

sed -i "/<https>/,/<\/https>/ s|<bind_addr>[^<]*</bind_addr>|<bind_addr>0.0.0.0</bind_addr>|g" /var/wazuh-manager/etc/wazuh-manager.conf

# Serve the agent-facing HTTPS port with the certificate generated for
# "wazuh.manager.local" instead of the self-signed one the package generates.
# Agents verify the manager certificate by default now, and the package cert is
# self-signed with a SAN that does not cover the address agents connect to, so
# with it enrollment fails on both the chain and the hostname. The generated
# certificate is signed by the environment's root CA and carries the right SAN,
# which is what lets agents enroll with verification left on.
if [ -n "$AGENT_SSL_CERTIFICATE" ] && [ -n "$AGENT_SSL_CERTIFICATE_KEY" ]; then
  # remoted resolves these paths relative to the manager home, so the pair has
  # to be copied in: an absolute path into the shared certificate volume is
  # reported as "missing or unreadable" and the HTTPS server never starts.
  cp "$AGENT_SSL_CERTIFICATE" /var/wazuh-manager/etc/certs/agent-comms.pem
  cp "$AGENT_SSL_CERTIFICATE_KEY" /var/wazuh-manager/etc/certs/agent-comms-key.pem
  chown "$WAZUH_USER_AND_GROUP" /var/wazuh-manager/etc/certs/agent-comms.pem /var/wazuh-manager/etc/certs/agent-comms-key.pem
  chmod 400 /var/wazuh-manager/etc/certs/agent-comms.pem /var/wazuh-manager/etc/certs/agent-comms-key.pem

  sed -i "/<https>/,/<\/https>/ s|<certificate>[^<]*</certificate>|<certificate>etc/certs/agent-comms.pem</certificate>|g" /var/wazuh-manager/etc/wazuh-manager.conf
  sed -i "/<https>/,/<\/https>/ s|<key>[^<]*</key>|<key>etc/certs/agent-comms-key.pem</key>|g" /var/wazuh-manager/etc/wazuh-manager.conf
fi

# Configure the agent enrollment password expected by authd (use_password is
# enabled by default in the manager package; without this file authd generates
# a random password and agent enrollment fails with "Invalid password")
if [ -n "$WAZUH_REGISTRATION_PASSWORD" ]; then
  echo "$WAZUH_REGISTRATION_PASSWORD" > /var/wazuh-manager/etc/authd.pass
  chmod 640 /var/wazuh-manager/etc/authd.pass
  chown root:wazuh-manager /var/wazuh-manager/etc/authd.pass
fi

# Clean up stale PID and socket files from previous unclean shutdowns
# (e.g. after docker stop + docker start without recreating the container)
find /var/wazuh-manager/var/run -name "*.pid" -delete 2>/dev/null || true
find /var/wazuh-manager/queue -name "*.sock" -o -name "wdb" -type s -delete 2>/dev/null || true

# Start service
/var/wazuh-manager/bin/wazuh-manager-control start

# Read logs file
tail -f /var/wazuh-manager/logs/wazuh-manager.log
