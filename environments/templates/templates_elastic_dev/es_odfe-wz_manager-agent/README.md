# Docker environment

## Containers
- 1 Wazuh Manager with Filebeat (Manager mode)
- Elasticsearch with Open Distro for Elasticsearch
- Wazuh Agent

## Services

Elasticsearch API: `https://CONTAINER_HOST_IP:9200`
Wazuh API: `https://CONTAINER_HOST_IP:55000`

### Credentials

admin user:
- `user`: `admin`
- `password`: `admin`.

kibanasystem user:
- `user`: `kibanasystem`
- `password`: `kibanasystem`.

Use in `kibana.yml`

## How to use
| Command              | Description                            |
| -------------------- | -------------------------------------- |
| docker-compose up -d | Up environment                         |
| docker-compose stop  | Stop environment                       |
| docker-compose down  | Stop environment and remove containers |

## Connect Kibana

This environment doesn't provide of Kibana. You need a Kibana instance with the same version of Elasticsearch.

Check the `config/kibana/kibana.odfe.yml` for a configuration example.