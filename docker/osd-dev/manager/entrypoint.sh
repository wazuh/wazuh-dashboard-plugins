#!/bin/bash

# Change permissions to certificates
chmod 500 /etc/server_certs
chmod 400 /etc/server_certs/*
chown -R root:root /etc/server_certs

# Start service
/var/ossec/bin/wazuh-control start

# Read logs file
tail -f /var/ossec/logs/ossec.log
