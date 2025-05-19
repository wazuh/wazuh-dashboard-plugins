#!/bin/bash

# Change permissions to certificates
chmod 500 /etc/filebeat/certs
chmod 400 /etc/filebeat/certs/*
chown -R root:root /etc/filebeat/certs

# Start services
service filebeat start
/var/ossec/bin/wazuh-control start

tail -f /var/ossec/logs/ossec.log
