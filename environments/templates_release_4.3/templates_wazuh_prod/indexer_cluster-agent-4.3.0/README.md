# Docker environment

## Containers
- Wazuh Manager with Filebeat (Manager mode)
- OpenSearch
- OpenSearch Dashboards
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

## Index data with Filebeat

Opensearch requires to enable the compatibility with Filebeat to the data can be indexed.

Set the OpenSearch setting `compatibility.override_main_response_version: true`. The environment sets the setting.