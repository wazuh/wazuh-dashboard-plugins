# Install dependencies
apt update
apt install -y curl adduser lsb-release

# Install Wazuh server
dpkg -i /installer/wazuh-manager.deb

# Configure Wazuh server-Wazuh indexer connection
echo 'admin' | /var/ossec/bin/wazuh-keystore -f indexer -k username
echo 'admin' | /var/ossec/bin/wazuh-keystore -f indexer -k password

NODE="wazuh.manager.local"
INDEXER_HOST="os1"
CERTS_PATH="/etc/filebeat/certs"
WAZUH_VERSION="v4.12.0"

sed -i "s|https://0.0.0.0:9200|https://$INDEXER_HOST:9200|g" /var/ossec/etc/ossec.conf
sed -i "s|/etc/filebeat/certs/root-ca.pem|$CERTS_PATH/ca.pem|g" /var/ossec/etc/ossec.conf
sed -i "s|/etc/filebeat/certs/filebeat.pem|$CERTS_PATH/$NODE.pem|g" /var/ossec/etc/ossec.conf
sed -i "s|/etc/filebeat/certs/filebeat-key.pem|$CERTS_PATH/$NODE-key.pem|g" /var/ossec/etc/ossec.conf

# Install Filebeat
apt install gnupg apt-transport-https -y
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import && chmod 644 /usr/share/keyrings/wazuh.gpg
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | tee -a /etc/apt/sources.list.d/wazuh.list
apt-get update
apt-get -y install filebeat

# Configure Filebeat
curl -so /etc/filebeat/filebeat.yml https://packages.wazuh.com/4.12/tpl/wazuh/filebeat/filebeat.yml
sed -i "s|127.0.0.1|$INDEXER_HOST|g" /etc/filebeat/filebeat.yml
sed -i "s|/etc/filebeat/certs/root-ca.pem|$CERTS_PATH/ca.pem|g" /etc/filebeat/filebeat.yml
sed -i "s|/etc/filebeat/certs/filebeat.pem|$CERTS_PATH/$NODE.pem|g" /etc/filebeat/filebeat.yml
sed -i "s|/etc/filebeat/certs/filebeat-key.pem|$CERTS_PATH/$NODE-key.pem|g" /etc/filebeat/filebeat.yml
filebeat keystore create
echo admin | filebeat keystore add username --stdin --force
echo admin | filebeat keystore add password --stdin --force
curl -so /etc/filebeat/wazuh-template.json https://raw.githubusercontent.com/wazuh/wazuh/$WAZUH_VERSION/extensions/elasticsearch/7.x/wazuh-template.json
chmod go+r /etc/filebeat/wazuh-template.json
curl -s https://packages.wazuh.com/4.x/filebeat/wazuh-filebeat-0.4.tar.gz | tar -xvz -C /usr/share/filebeat/module
