#!/bin/bash

INDEXER_HOME=/usr/share/wazuh-indexer
CERTS_DIR=/etc/wazuh-indexer/certs
SECURITY_CONF=/etc/wazuh-indexer/opensearch-security
OPENSEARCH_YML=/etc/wazuh-indexer/opensearch.yml
INTERNAL_USERS="$SECURITY_CONF/internal_users.yml"

# Fixed development passwords. The package's resolve-credentials.sh would
# reject them (its policy asks for 12+ characters of mixed classes), so the
# image skips it (see installer.sh) and they are hashed here instead, with the
# same tool it uses.
INDEXER_ADMIN_PASSWORD="${INDEXER_ADMIN_PASSWORD:-admin}"
INDEXER_KIBANASERVER_PASSWORD="${INDEXER_KIBANASERVER_PASSWORD:-kibanaserver}"
INDEXER_MANAGER_PASSWORD="${INDEXER_MANAGER_PASSWORD:-wazuh-manager}"

hash_password() {
  WAZUH_INDEXER_SECRET="$1" OPENSEARCH_JAVA_HOME="$INDEXER_HOME/jdk" \
    "$INDEXER_HOME/plugins/opensearch-security/tools/hash.sh" -env WAZUH_INDEXER_SECRET 2>/dev/null |
    grep -Eo '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$' |
    tail -n 1
}

# index/substr rather than sed: the digest carries '$', '/' and '.'.
substitute_placeholder() {
  WAZUH_INDEXER_DIGEST="$2" awk -v var="$1" '
    {
      placeholder = "${" var "}"
      position = index($0, placeholder)
      if (position > 0) {
        $0 = substr($0, 1, position - 1) ENVIRON["WAZUH_INDEXER_DIGEST"] \
             substr($0, position + length(placeholder))
      }
      print
    }
  ' "$3" > "$3.tmp" && cat "$3.tmp" > "$3" && rm -f "$3.tmp"
}

# Rebuilt from the pristine template on every start, so changing a password is
# a matter of recreating the container with the new value.
cp "$INTERNAL_USERS.template" "$INTERNAL_USERS"
for entry in \
  "WAZUH_INDEXER_ADMIN_PASSWORD:$INDEXER_ADMIN_PASSWORD" \
  "WAZUH_INDEXER_KIBANASERVER_PASSWORD:$INDEXER_KIBANASERVER_PASSWORD" \
  "WAZUH_INDEXER_MANAGER_PASSWORD:$INDEXER_MANAGER_PASSWORD"; do
  key="${entry%%:*}"
  digest=$(hash_password "${entry#*:}")
  if [ -z "$digest" ]; then
    echo "ERROR: could not hash $key."
    exit 1
  fi
  substitute_placeholder "$key" "$digest" "$INTERNAL_USERS"
done
if grep -q '\${WAZUH_INDEXER_' "$INTERNAL_USERS"; then
  echo "ERROR: $INTERNAL_USERS still has unresolved password placeholders."
  exit 1
fi

# The package ships nodes_dn and admin_dn empty for the resolver to fill in
# from the certificates it issues. Here the certificates are the generator's,
# mounted at runtime, so fill them in from those.
subject_of() {
  openssl x509 -in "$1" -noout -subject -nameopt RFC2253 | sed 's/^subject= *//'
}
NODE_DN=$(subject_of "$CERTS_DIR/indexer.pem")
ADMIN_DN=$(subject_of "$CERTS_DIR/admin.pem")
if [ -z "$NODE_DN" ] || [ -z "$ADMIN_DN" ]; then
  echo "ERROR: could not read the certificate subjects in $CERTS_DIR."
  exit 1
fi
WAZUH_NODE_DN="$NODE_DN" WAZUH_ADMIN_DN="$ADMIN_DN" awk '
  BEGIN { skip = 0 }
  /^plugins\.security\.nodes_dn[[:space:]]*:/ {
    print "plugins.security.nodes_dn:"
    print "- \"" ENVIRON["WAZUH_NODE_DN"] "\""
    skip = 1
    next
  }
  /^plugins\.security\.authcz\.admin_dn[[:space:]]*:/ {
    print "plugins.security.authcz.admin_dn:"
    print "- \"" ENVIRON["WAZUH_ADMIN_DN"] "\""
    skip = 1
    next
  }
  skip && /^[[:space:]]*#?[[:space:]]*-[[:space:]]/ { next }
  { skip = 0; print }
' "$OPENSEARCH_YML" > "$OPENSEARCH_YML.tmp" && cat "$OPENSEARCH_YML.tmp" > "$OPENSEARCH_YML" && rm -f "$OPENSEARCH_YML.tmp"

# Change permissions
chown -R wazuh-indexer:wazuh-indexer /etc/wazuh-indexer
chown -R wazuh-indexer:wazuh-indexer /etc/wazuh-indexer/certs
chown -R wazuh-indexer:wazuh-indexer /var/lib/wazuh-indexer
chown -R wazuh-indexer:wazuh-indexer /var/log/wazuh-indexer

if [ -x "$INDEXER_HOME/engine/run_engine.sh" ]; then
  nohup "$INDEXER_HOME/engine/run_engine.sh" > /dev/null 2>&1 &
  echo $! > /run/wazuh-indexer/wazuh-engine.pid

  ENGINE_API_SOCK="$INDEXER_HOME/engine/sockets/engine-api-http.sock"
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
