# Install dependencies (iproute2, openssl and diffutils are required by the wazuh-indexer package)
apt update
apt install -y debconf adduser procps curl iproute2 openssl diffutils

# The package postinst runs resolve-credentials.sh --install, which generates
# random passwords, mints a bootstrap CA and issues certificates for the build
# container. None of that fits this environment: the passwords must stay the
# fixed development ones (which its password policy rejects) and the
# certificates come from the "generator" service at runtime. The resolver skips
# everything once its initialisation marker exists, so create it first. The
# entrypoint then resolves the credentials itself on every start.
mkdir -p /var/lib/wazuh-indexer
touch /var/lib/wazuh-indexer/.initialized

# Install Wazuh indexer
dpkg -i /installer/wazuh-indexer.deb

# Keep the users file with its ${WAZUH_INDEXER_*_PASSWORD} placeholders, so the
# entrypoint can hash the configured passwords into a fresh copy on each start.
cp /etc/wazuh-indexer/opensearch-security/internal_users.yml \
  /etc/wazuh-indexer/opensearch-security/internal_users.yml.template
if ! grep -q '\${WAZUH_INDEXER_ADMIN_PASSWORD}' \
  /etc/wazuh-indexer/opensearch-security/internal_users.yml.template; then
  echo "ERROR: the package resolved the credentials at build time; the password placeholders are gone."
  exit 1
fi

# Remove package installer
rm /installer/wazuh-indexer.deb
