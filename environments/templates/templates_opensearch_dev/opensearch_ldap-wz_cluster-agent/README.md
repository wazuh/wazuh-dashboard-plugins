# Docker environment

## Containers
- Wazuh Manager with Filebeat (Manager mode)
- OpenSearch
- Wazuh Agent

## Services

OpenSearch API: `https://CONTAINER_HOST_IP:9200`
Wazuh API: `https://CONTAINER_HOST_IP:55000`

## How to use
| Command              | Description                            |
| -------------------- | -------------------------------------- |
| docker-compose up -d | Up environment                         |
| docker-compose stop  | Stop environment                       |
| docker-compose down  | Stop environment and remove containers |

## Connect OpenSearch

This environment doesn't provide of OpenSearch Dashboards. You need a OpenSearch Dashboards instance with the same version of OpenSearch.

Check the `config/opensearch_dashbaords/opensearch_dashboards.yml` for a configuration example.

## Index data with Filebeat

Opensearch requires to enable the compatibility with Filebeat to the data can be indexed.

Set the OpenSearch setting `compatibility.override_main_response_version: true`. The environment sets the setting.

## LDAP

Defined users in the `directory.dif` file used for the `openldap` service:
- Jane Roe
  - username: `jroe`
  - password: `password`
  - roles: `Developers`

- John Doe
  - username: `jdoe`
  - password: `password`
  - roles: `Developers`

- Paulo Santos
  - username: `psantos`
  - password: `password`
  - roles: `Administrator`, `Developers`

The LDAP roles are used for the OpenSearch role mapping that give the Opensearch role and give permissions. There a `role_mapping.yml` file mounted into the `opensearch` service that define the roles `Administrator` and `Developers` for the initial configuration so these LDAP users have Opensearch role thank to the role mapping.
