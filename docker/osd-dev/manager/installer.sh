# Install dependencies
apt update

# Add en_US.UTF-8 locale required for some decoder
# 2025/12/11 10:05:47 wazuh-analysisd: ERROR: CTI: deploy callback failed: Failed to push decoder 'decoder/f5-bigip-afm/0' to catalog: An error occurred while trying to validate 'decoder/f5-bigip-afm/0': In stage 'normalize' builder for block 'map' failed with error: Failed to build operation 'f5_bigip.log.date_time: parse_date($json.date_time, "%b %d %Y %H:%M:%S", "en_US.UTF-8")': Can't build date parser, locale 'en_US.UTF-8' not found
# openssl backs the certificate tool the entrypoint runs to issue the agent listener certificate
# iproute2 and diffutils are required by the wazuh-manager package
apt install -y curl adduser lsb-release libterm-readline-perl-perl locales openssl iproute2 diffutils
locale-gen en_US.UTF-8

# Install Wazuh server
dpkg -i /installer/wazuh-manager.deb

# The package postinst ran wazuh-manager-resolve-credentials --install, which
# seeded rbac.db with random passwords, minted a bootstrap CA (private key
# included) and issued certificates for the build container. Clear all of it,
# as the manager documents for container images; the entrypoint then seeds
# rbac.db with the fixed development passwords and installs the certificates.
if ! /var/wazuh-manager/bin/wazuh-manager-resolve-credentials --clear; then
  echo "ERROR: could not clear the credentials resolved at build time."
  exit 1
fi

# Remove package installer
rm /installer/wazuh-manager.deb
