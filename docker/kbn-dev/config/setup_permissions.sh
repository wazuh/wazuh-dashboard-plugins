#/bin/sh

# X-Pack environment utility which:
#   - creates the "wazuh_app" user
#   - creates the "wazuh_indices" role
#   - maps the "wazuh_indices" role to the "wazuh_app" user

# Elasticsearch host
elasticsearch_admin="elastic"
elasticsearch_admin_password="SecretPassword"
elasticsearch_host="https://${1-localhost}:9200"

# User, roles and role mapping definition
wazuh_indices_role="wazuh_indices"
wazuh_indices_pattern="wazuh-*"
wazuh_user_username="wazuh_app"
wazuh_user_password="wazuh_app"
kibana_system_role="kibana_system"

exit_with_message(){
  echo $1;
  exit 1;
}

# Create "wazuh_indices" role
echo " Creating '$wazuh_indices_role' role..."
curl \
  -X POST \
  -H 'Content-Type: application/json' \
  -k -u $elasticsearch_admin:$elasticsearch_admin_password \
  $elasticsearch_host/_security/role/$wazuh_indices_role -d@- << EOF || exit_with_message "Error creating $wazuh_indices_role role"
{
  "cluster": [ "all" ],
  "indices": [
    {
      "names" : [ "$wazuh_indices_pattern" ],
      "privileges": [ "all" ]
    }
  ]
}
EOF
echo ""

# Create "wazuh_user" user
echo "Creating "$wazuh_user_username" user..."
curl \
  -X POST \
  -H 'Content-Type: application/json' \
  -k -u $elasticsearch_admin:$elasticsearch_admin_password \
  $elasticsearch_host/_security/user/$wazuh_user_username -d@- << EOF || exit_with_message "Error creating $wazuh_user_username user"
{
  "username" : "$wazuh_user_username",
  "password" : "$wazuh_user_password",
  "roles" : [ "$kibana_system_role", "$wazuh_indices_role" ],
  "full_name" : "",
  "email" : ""
}
EOF
echo ""
