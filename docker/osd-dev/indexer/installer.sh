# Install dependencies
apt update
apt install -y debconf adduser procps curl

# Install Wazuh server
dpkg -i /installer/wazuh-indexer.deb

# Remove package installer
rm /installer/wazuh-indexer.deb
