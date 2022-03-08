#/bin/sh

# X-Pack environment utility which:
#   - create "wazuh_user" user
#   - create "wazuh_indices" role
#   - map "wazuh_indices" rol to "wazuh_user" and "kibanaserver" users

# Elasticsearch host
elasticsearch_admin="elastic"
elasticsearch_admin_password="elastic"
elasticsearch_host="https://${1-localhost}:9200"

# User, roles and role mapping definition
wazuh_indices_role="wazuh_indices"
wazuh_indices_pattern="wazuh*"
wazuh_user_username="wazuh_user"
wazuh_user_password="wazuh_user"
wazuh_kibana_username="wazuh_kibana_system"
kibana_system_role="kibana_system"

exit_with_message(){
  echo $1;
  exit 1;
}

# Create "wazuh_indices" role
echo "Creating '$wazuh_indices_role' role..."
curl -XPOST -H 'Content-Type: application/json' -k -u $elasticsearch_admin:$elasticsearch_admin_password $elasticsearch_host/_security/role/$wazuh_indices_role -d@- << EOF || exit_with_message "Error creating $wazuh_indices_role role"
{
  "cluster": [],
  "indices": [
    {
      "names": [ "$wazuh_indices_pattern" ],
      "privileges": ["all"],
      "field_security" : {},
      "query": ""
    }
  ],
  "applications": [],
  "run_as": [],
  "metadata" : {}
}
EOF

#Create "wazuh_user" user
echo "Creating "$wazuh_user_username" user..."
curl -XPOST -H 'Content-Type: application/json' -k -u $elasticsearch_admin:$elasticsearch_admin_password $elasticsearch_host/_security/user/$wazuh_user_username -d@- << EOF || exit_with_message "Error creating $wazuh_user_username user"
{
  "password" : "$wazuh_user_username",
  "roles" : [ "$wazuh_indices_role" ],
  "full_name" : "$wazuh_user_username",
  "email" : "$wazuh_user_username@wz.wz",
  "metadata" : {}
}
EOF

#Create "wazuh__kibana_system" user
echo "Creating '$wazuh_kibana_username' user..."
curl -XPOST -H 'Content-Type: application/json' -k -u $elasticsearch_admin:$elasticsearch_admin_password $elasticsearch_host/_security/user/$wazuh_kibana_username -d@- << EOF || exit_with_message "Error creating $wazuh_kibana_username user"
{
  "password" : "$wazuh_kibana_username",
  "roles" : [ "$kibana_system_role", "$wazuh_indices_role" ],
  "full_name" : "$wazuh_kibana_username",
  "email" : "$wazuh_kibana_username@wz.wz",
  "metadata" : {}
}
EOF

echo "Successful created:
  - Role: $wazuh_indices_role
  - User: $wazuh_user_username
  - User: $wazuh_kibana_username

Replace the kibana internal user by:
elasticsearch.username: $wazuh_kibana_username
elasticsearch.password: $wazuh_kibana_username
"
