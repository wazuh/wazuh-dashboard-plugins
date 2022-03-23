# Docker environment

## Containers
- 2 Wazuh Manager with Filebeat (Cluster mode)
  - 1 master
  - 1 worker
- Elasticsearch
- Wazuh Agent

## Services

Elasticsearch API: `https://CONTAINER_HOST_IP:9200`
Wazuh API: `https://CONTAINER_HOST_IP:55000`

### Credentials

elastic user:
- `user`: `elastic`
- `password`: `elastic`.

kibana_user:
- `user`: `kibana_user`
- `password`: `kibana_user`.

Use in `kibana.yml`

## How to use

### Setup environment

X-Pack needs certificates to work and generate the users and passwords. This setup can be initialized with:

**EXECUTE THIS STEP ONLY THE FIRST TIME TO CREATE THE SETUP**

```
sh setup.sh
```

This script does:
- Create an `setup` directory with:
  - `certs`: certificates for wazuh manager, elasticsearch and kibana services. Use the `instances.yml`.
  - `elastic_passwords.txt`: the bootstrap Elasticsearch passwords

- Bootstrap the Elasticsearch passwords
> Change passwords for `elastic` and `kibana_system` users
>
> User: `elastic`
> Password: `elastic`
>
> User: `kibana_system`
> Password: `kibana_system`

### Stop environment

If you want to keep the environment with the setup, don't remove the `setup` directory and not remove the containers, only stop the containers.

### Destroy enviroment

Destroy the setup configuration (certificates and Elasticsearch passwords) with:

```
sh clean.sh
```
This script does:
- Remove `setup` directory
- Stop and remove the containers

## Connect Kibana dev

This environment doesn't provide of Kibana. You need a Kibana instance with the same version of Elasticsearch.

Check the `config/kibana/kibana.xpack.yml` for a configuration example.
