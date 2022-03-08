#/bin/sh

# Open Distro environment utility which:
#   - create "wazuh_user" user
#   - create "wazuh_indices" role
#   - map "wazuh_indices" rol to "wazuh_user" and "kibanaserver" users

# Elasticsearch host
elasticsearch_admin="admin"
elasticsearch_admin_password="admin"
elasticsearch_host="https://${1-localhost}:9200"

# User, roles and role mapping definition
wazuh_indices_role="wazuh_indices"
wazuh_indices_pattern="wazuh*"
wazuh_user_username="wazuh_user"
wazuh_user_password="wazuh_user"
kibanaserver_username="kibanaserver"

exit_with_message(){
  echo $1;
  exit 1;
}

# Create "wazuh_indices" role
echo "Creating '$wazuh_indices_role' role..."
curl -XPUT -H 'Content-Type: application/json' -k -u $elasticsearch_admin:$elasticsearch_admin_password $elasticsearch_host/_opendistro/_security/api/roles/$wazuh_indices_role -d@- << EOF || exit_with_message "Error creating $wazuh_indices_role role"
{
  "index_permissions": [{
    "index_patterns": [
      "$wazuh_indices_pattern"
    ],
    "dls": "",
    "fls": [],
    "masked_fields": [],
    "allowed_actions": [
      "indices_all"
    ]
  }]
}
EOF

#Create "wazuh_user" user
echo "Creating '$wazuh_user_username' user..."
curl -XPUT -H 'Content-Type: application/json' -k -u $elasticsearch_admin:$elasticsearch_admin_password $elasticsearch_host/_opendistro/_security/api/internalusers/$wazuh_user_username -d@- << EOF || exit_with_message "Error creating $wazuh_user_username user"
{
  "password": "$wazuh_user_password",
  "opendistro_security_roles": ["$wazuh_indices_role"]
}
EOF

# Map "wazuh_indices" role to users "wazuh_user" and "kibanaserver"
echo "Role mapping '$wazuh_indices_role' to '$wazuh_user_username' and '$kibanaserver_username' users..."
curl -XPUT -H 'Content-Type: application/json' -k -u $elasticsearch_admin:$elasticsearch_admin_password $elasticsearch_host/_opendistro/_security/api/rolesmapping/$wazuh_indices_role -d@- << EOF || exit_with_message "Error doing the role mapping: $wazuh_indices_role > $kibanaserver_username, $wazuh_user_username"
{
  "users" : [ "$wazuh_user_username", "$kibanaserver_username" ]
}
EOF

echo "Successful created:
  - Role: $wazuh_indices_role
  - User: $wazuh_user_username
  - Role mapping: $wazuh_indices_role > $kibanaserver_username, $wazuh_user_username
"
