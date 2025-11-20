# Install dependencies
apt update
apt install -y curl adduser lsb-release

# Install Wazuh server
dpkg -i /installer/wazuh-manager.deb

# Remove package installer
rm /installer/wazuh-manager.deb
