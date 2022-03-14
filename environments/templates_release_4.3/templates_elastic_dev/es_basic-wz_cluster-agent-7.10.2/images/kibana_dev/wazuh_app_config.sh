#!/bin/bash

wazuh_url="${WAZUH_API_URL:-https://ES-UNA-API-URL}"
wazuh_port="${API_PORT:-55000}"
api_username="${API_USERNAME:-wazuh-wui}"
api_password="${API_PASSWORD:-wazuh-wui}"
api_run_as="${RUN_AS:-false}"

wazuh_config_file="/usr/share/kibana/data/wazuh/config/wazuh.yml"

grep -q 1513629884013 $wazuh_config_file
_config_exists=$?

if [[ $_config_exists -ne 0 ]]; then
cat << EOF > $wazuh_config_file
hosts:
  - 1513629884013:
      url: $wazuh_url
      port: $wazuh_port
      username: $api_username
      password: $api_password
      run_as: $api_run_as
EOF
else
  echo "Wazuh APP already configured"
fi
