# Install dependencies
apt update

# Add en_US.UTF-8 locale required for some decoder
# 2025/12/11 10:05:47 wazuh-analysisd: ERROR: CTI: deploy callback failed: Failed to push decoder 'decoder/f5-bigip-afm/0' to catalog: An error occurred while trying to validate 'decoder/f5-bigip-afm/0': In stage 'normalize' builder for block 'map' failed with error: Failed to build operation 'f5_bigip.log.date_time: parse_date($json.date_time, "%b %d %Y %H:%M:%S", "en_US.UTF-8")': Can't build date parser, locale 'en_US.UTF-8' not found
apt install -y curl adduser lsb-release libterm-readline-perl-perl locales
locale-gen en_US.UTF-8

# Install Wazuh server
dpkg -i /installer/wazuh-manager.deb

# Remove package installer
rm /installer/wazuh-manager.deb
