# Docker environment

## Containers
- Elasticsearch

## Services

Elasticsearch API: `https://CONTAINER_HOST_IP:9200`
Wazuh API: `https://CONTAINER_HOST_IP:55000`

## How to use

This create certificates using the configuration of `config/certificates/instances.yml` into the `config/certificates/certs` directory.

| Command                   | Description                            |
| ------------------------- | -------------------------------------- |
| docker-compose up -d --rm | Up environment                         |
| docker-compose stop       | Stop environment                       |
| docker-compose down       | Stop environment and remove containers |
