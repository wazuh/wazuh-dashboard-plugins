#!/bin/bash
# Define the main function
main(){
  if [ -z ${WAZUH_API_URL+x} ]; then
cat <<EOF
ERROR: WAZUH_API_URL variable is not defined.
If you are using npm script to launch it, use:
  WAZUH_API_URL="WAZUH_API_URL" npm run <script_name>
  Example: WAZUH_API_URL="https://172.16.1.2:55000" npm run <script_name>
EOF
    exit 1
  fi
  echo "Generate Wazuh API 4.0 endpoints data and format to use in Wazuh app";
  local API_LIST_PATH="../../util/api-request-list.json";
  local API_ENDPOINTS_OUTPUT_DIRECTORY="endpoints";
  local API_ENDPOINTS_OUTPUT_FILE="api-4.0-endpoints.json";
  local API_ENDPOINTS_OUTPUT_PATH="$API_ENDPOINTS_OUTPUT_DIRECTORY/$API_ENDPOINTS_OUTPUT_FILE";
  node generate-api-4.0-info.js $WAZUH_API_URL --full || exit_with_message "ERROR: the script had an error";
  echo "Moving file to $API_LIST_PATH";
  mv $API_ENDPOINTS_OUTPUT_PATH $API_LIST_PATH || exit_with_message "ERROR: moving the generated file";
  echo "Removing temporal directory";
  rm -rf $API_ENDPOINTS_OUTPUT_DIRECTORY || exit_with_message "ERROR: removing the temporal directory";
  echo "Success generating Wazuh API 4.0 endpoints info!";
}

# Function to exit with a message
exit_with_message(){
  echo $1
  exit 1
}

# Run main function
main
