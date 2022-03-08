#!/usr/bin/env bash

WITNESS_FILE_PATH=/tmp/wazuh_configurated

if [ ! -f $WITNESS_FILE_PATH ]; then
    /opt/splunk/bin/splunk start --accept-license --answer-yes --no-prompt
    
    # Create a witness file
    touch $WITNESS_FILE_PATH
fi

/opt/splunk/bin/splunk start --accept-license --answer-yes --no-prompt

tail -f /dev/null