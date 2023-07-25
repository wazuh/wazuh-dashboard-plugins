#!/usr/bin/env bash

WITNESS_FILE_PATH=/tmp/wazuh_configurated

NODE_IP="${NODE_IP:-$1}"
NODE_NAME="${NODE_NAME:-$2}"
NODE_TYPE="${NODE_TYPE:-$3}"
NODE_KEY="${NODE_KEY:-9d273b53510fef702b54a92e9cffc82e}"
CLUSTER_NAME="${CLUSTER_NAME:-wazuh}"
CLUSTER_DISABLED="${CLUSTER_DISABLED:-no}"

if [ ! -f $WITNESS_FILE_PATH ]; then
    # Set right permissions for test_config data
    chown root:ossec /var/ossec/etc/ossec.conf
    chown root:ossec /var/ossec/etc/client.keys
    chown -R ossec:ossec /var/ossec/queue/agent-groups
    chown -R ossec:ossec /var/ossec/etc/shared
    chown root:ossec /var/ossec/etc/shared/ar.conf
    chown -R ossecr:ossec /var/ossec/queue/agent-info

    # Modify ossec.conf
    sed -i "s:<key></key>:<key>$NODE_KEY</key>:g" /var/ossec/etc/ossec.conf
    sed -i "s:<node>NODE_IP</node>:<node>$NODE_IP</node>:g" /var/ossec/etc/ossec.conf
    sed -i "s:<name>wazuh</name>:<name>$CLUSTER_NAME</name>:g" /var/ossec/etc/ossec.conf
    sed -i -e "/<cluster>/,/<\/cluster>/ s|<disabled>[a-z]\+</disabled>|<disabled>$CLUSTER_DISABLED</disabled>|g" /var/ossec/etc/ossec.conf
    sed -i "s:<node_name>node01</node_name>:<node_name>$NODE_NAME</node_name>:g" /var/ossec/etc/ossec.conf
    sed -i "s:<node_type>master</node_type>:<node_type>$NODE_TYPE</node_type>:g" /var/ossec/etc/ossec.conf
    
    # Create a witness file
    touch $WITNESS_FILE_PATH
fi

chown root: /etc/filebeat/filebeat.yml
chmod go-w /etc/filebeat/filebeat.yml

service filebeat start

sleep 1

service wazuh-manager restart
/var/ossec/bin/wazuh-apid restart

/usr/bin/supervisord