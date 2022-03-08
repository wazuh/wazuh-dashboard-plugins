## How to use

### Create the environment

X-Pack needs certificates to work and generate the users and passwords. This setup can be initialized with:

```
sh setup.sh
```

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

- Create certificates to use with nginx located in `setup/nginx_certs`

To continue with the same environment and up the containers, after the setup is created, you can do with `docker-compose up -d`.

### Clean the certificates, passwords, stop and remove the containers

To remove the containers and the `setup` directory with the certificates and Elasticsearch passwords

```
sh clean.sh
```
