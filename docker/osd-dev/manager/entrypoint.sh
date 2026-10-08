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

# Agent-facing listener certificate. One pair, read by both <remote><https>
# (the HTTPS listener agents enroll and report through, 1517) and <auth>.
#
# The manager package does not generate certificates: it refuses to start with
# "file not found: /var/wazuh-manager/etc/certs/remoted.pem". Agents also verify
# the certificate, so it needs a SAN covering the address they connect to.
# Issue it here with the installation assistant certificate tool, the same one
# the wazuh repository uses to provision its manager integration tests, so this
# environment exercises the deployment path.
#
# The CA is deliberately NOT minted here (hence -wm and not -A): the indexer,
# the dashboard, imposter and the agents already trust the root CA that the
# "generator" service left in the shared volume, and a fresh CA would break all
# of them.
CERTS_TOOL="${CERTS_TOOL:-/usr/share/wazuh-certs-tool/wazuh-certs-tool.sh}"
CERTS_CONFIG="${CERTS_CONFIG:-/etc/wazuh-certs.yml}"
CERTS_NODE_NAME="${CERTS_NODE_NAME:-wazuh.manager.local}"
CERTS_CA="${CERTS_CA:-/etc/server_certs/root-ca.pem}"
CERTS_CA_KEY="${CERTS_CA_KEY:-/etc/server_certs/root-ca-key.pem}"

# The generator writes the CA into the shared volume concurrently. Give up
# rather than wait forever, the way the agent containers already do: without a
# CA there is nothing to sign with, and a container stuck here looks like a hang.
ca_wait=0
while [ ! -f "$CERTS_CA" ] || [ ! -f "$CERTS_CA_KEY" ]; do
  if [ "$ca_wait" -ge 120 ]; then
    echo "ERROR: the root CA pair did not appear in /etc/server_certs after ${ca_wait}s."
    echo "The certificate generator may not have run. Check the 'generator' service."
    exit 1
  fi
  echo "Waiting for the root CA..."
  sleep 2
  ca_wait=$((ca_wait + 2))
done

# Private output directory: the tool copies root-ca.key next to the leaves it
# issues, and that must never reach the volume the agent containers mount.
certs_out="$(mktemp -d)"
if ! bash "$CERTS_TOOL" -wm "$CERTS_CA" "$CERTS_CA_KEY" -c "$CERTS_CONFIG" -o "$certs_out" -f; then
  echo "ERROR: could not issue the agent-facing listener certificate."
  rm -rf "$certs_out"
  exit 1
fi

# Install under the names the shipped configuration already expects, so nothing
# has to be rewritten: both <remote><https> and <auth> read
# etc/certs/remoted.pem, and <remote><https> reads etc/certs/root-ca.pem. These
# paths are relative to the manager home, so the files have to be copied in; an
# absolute path into the shared certificate volume is reported as "missing or
# unreadable" and the manager refuses to start.
#
# The Server API (55000) reads etc/certs/apid.pem / apid-key.pem and no longer
# generates a self-signed pair: without them it refuses to start with error
# 2003. The manager installer issues that pair with the same profile as
# remoted.pem (serverAuth, leaf followed by the CA), so the listener leaf is
# installed under both names, as the wazuh devContainer does. Its SAN covers
# wazuh.manager.local, the address the dashboard connects to.
#
# Ownership follows the deployment model: remoted, authd and the API open the
# pairs after dropping privileges, while the CA only has to be group-readable.
mkdir -p /var/wazuh-manager/etc/certs
install -o root -g wazuh-manager -m 640 \
  "$CERTS_CA" /var/wazuh-manager/etc/certs/root-ca.pem
for pair in remoted apid; do
  install -o wazuh-manager -g wazuh-manager -m 640 \
    "$certs_out/$CERTS_NODE_NAME-remoted.pem" "/var/wazuh-manager/etc/certs/$pair.pem"
  install -o wazuh-manager -g wazuh-manager -m 640 \
    "$certs_out/$CERTS_NODE_NAME-remoted-key.pem" "/var/wazuh-manager/etc/certs/$pair-key.pem"
done
rm -rf "$certs_out"

# Server API users. wazuh-manager-resolve-credentials (run by
# wazuh-manager-control start) seeds rbac.db with generated passwords, or with
# supplied ones that pass its policy: 12+ characters of mixed classes, which the
# fixed development passwords do not. Seed it here instead, through the same
# ORM call rbac_control makes once it has validated them; the resolver leaves an
# already seeded rbac.db untouched. Only a new container gets here: a restarted
# one keeps its rbac.db, and its users, as they are.
RBAC_DB=/var/wazuh-manager/api/configuration/security/rbac.db
if [ ! -s "$RBAC_DB" ]; then
  if ! API_WAZUH_PASSWORD="${API_WAZUH_PASSWORD:-wazuh}" \
    API_WUI_PASSWORD="${API_PASSWORD:-wazuh-internal-client}" \
    /var/wazuh-manager/framework/python/bin/python3 -c '
import os
from wazuh.core.common import wazuh_gid, wazuh_uid

# As rbac_control does: rbac.db is created by the service user, never by root.
os.setgroups([])
os.setgid(wazuh_gid())
os.setuid(wazuh_uid())

from wazuh.rbac.orm import check_database_integrity

check_database_integrity(passwords={
    "wazuh": os.environ["API_WAZUH_PASSWORD"],
    "wazuh-internal-client": os.environ["API_WUI_PASSWORD"],
})
'; then
    echo "ERROR: could not seed $RBAC_DB with the Server API users."
    rm -f "$RBAC_DB"
    exit 1
  fi
fi

# Clean up stale PID and socket files from previous unclean shutdowns
# (e.g. after docker stop + docker start without recreating the container)
find /var/wazuh-manager/var/run -name "*.pid" -delete 2>/dev/null || true
find /var/wazuh-manager/queue -name "*.sock" -o -name "wdb" -type s -delete 2>/dev/null || true

# Start service
/var/wazuh-manager/bin/wazuh-manager-control start

# Read logs file
tail -f /var/wazuh-manager/logs/wazuh-manager.log
