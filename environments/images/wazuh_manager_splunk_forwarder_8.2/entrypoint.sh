#!/usr/bin/env bash

WITNESS_FILE_PATH=/tmp/wazuh_configurated

NODE_IP="${NODE_IP:-$1}"
NODE_NAME="${NODE_NAME:-$2}"
NODE_TYPE="${NODE_TYPE:-$3}"
NODE_KEY="${NODE_KEY:-9d273b53510fef702b54a92e9cffc82e}"
CLUSTER_NAME="${CLUSTER_NAME:-wazuh}"
CLUSTER_DISABLED="${CLUSTER_ENABLED:-no}"

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
    
    # Add configuration to the Splunk forwarder
    touch /opt/splunkforwarder/etc/splunk-launch.conf
    mkdir -p /opt/splunkforwarder/etc/system/local
    # /opt/splunkforwarder/bin/splunk restart --accept-license 
    /opt/splunkforwarder/bin/splunk start --accept-license --answer-yes --auto-ports --no-prompt
    curl -so /opt/splunkforwarder/etc/system/local/props.conf $SPLUNK_FORWARDER_PROPS_CONF_URL
    curl -so /opt/splunkforwarder/etc/system/local/inputs.conf $SPLUNK_FORWARDER_INPUTS_CONF_URL
    sed -i "s:MANAGER_HOSTNAME:$(hostname):g" /opt/splunkforwarder/etc/system/local/inputs.conf

    # Create the credentials file
cat <<-EOF > /opt/splunkforwarder/etc/system/local/user-seed.conf 
[user_info]
USERNAME=admin
PASSWORD=$SPLUNK_PASSWORD
EOF

    # Add the forward-server
    /opt/splunkforwarder/bin/splunk add forward-server $SPLUNK_INDEXER_URL
    
    /opt/splunkforwarder/bin/splunk restart
    
    # Create a witness file
    touch $WITNESS_FILE_PATH
fi

service wazuh-manager restart

/sbin/entrypoint.sh start-service

# tail -f /dev/null
/usr/bin/supervisord