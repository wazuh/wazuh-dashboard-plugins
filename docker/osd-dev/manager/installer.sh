# Install dependencies
apt update
apt install -y curl adduser lsb-release

# Install Wazuh server
dpkg -i /installer/wazuh-manager.deb

# Remove package installer
rm /installer/wazuh-manager.deb

# Configure Wazuh server-Wazuh indexer connection
echo 'admin' | /var/ossec/bin/wazuh-keystore -f indexer -k username
echo 'admin' | /var/ossec/bin/wazuh-keystore -f indexer -k password

NODE="wazuh.manager.local"
INDEXER_HOST="os1"
CERTS_PATH="/etc/server_certs"

sed -i "s|https://0.0.0.0:9200|https://$INDEXER_HOST:9200|g" /var/ossec/etc/ossec.conf
sed -i "s|/etc/filebeat/certs/root-ca.pem|$CERTS_PATH/ca.pem|g" /var/ossec/etc/ossec.conf
sed -i "s|/etc/filebeat/certs/filebeat.pem|$CERTS_PATH/$NODE.pem|g" /var/ossec/etc/ossec.conf
sed -i "s|/etc/filebeat/certs/filebeat-key.pem|$CERTS_PATH/$NODE-key.pem|g" /var/ossec/etc/ossec.conf
