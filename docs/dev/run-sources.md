# How to run from sources

The recommended way to run the plugins from source is using the Docker-based
development environments in [docker/](../../docker). These environments include
an OpenSearch indexer, Wazuh manager, OpenSearch Dashboards development
environment, optional Wazuh agents (with `-a` flag), and supporting services
(Imposter mock server, Elasticsearch-exporter).

## Start the OpenSearch Dashboards dev environment

1. Review the prerequisites in [docker/osd-dev/README.md](../../docker/osd-dev/README.md).
2. Start the environment from the repository root:

```bash
cd docker/osd-dev
./dev.sh up
```

The script auto-detects versions from `plugins/wazuh-core/package.json` and
internal plugins from `plugins/`. For specific versions:

```bash
./dev.sh up -os 2.11.0 -osd 2.11.0
```

For environments with agents:

```bash
./dev.sh up --server-local my-tag -a deb  # DEB-based agent
./dev.sh up --server-local my-tag -a rpm  # RPM-based agent
./dev.sh up --server-local my-tag -a without  # No agents
```

For SAML-enabled environments:

```bash
./dev.sh up -saml
```

See [docker/osd-dev/README.md](../../docker/osd-dev/README.md) for all available
options, including `--server`, `--indexer-local`, and external plugin mappings.

3. Attach a shell to the development container:

```bash
docker ps
docker exec -it <CONTAINER_ID> bash
```

4. From the container shell, start the dev server:

```bash
yarn start --no-base-path
```

If dependencies are missing, install them from the `/plugins` directory inside
the container (see [docker/osd-dev/README.md](../../docker/osd-dev/README.md)).

The dashboard should be available at https://0.0.0.0:5601/ (default credentials: `admin:admin`, or `wazuh:wazuh` for SAML environments).

## Environment components

The Docker environment includes:

- **OpenSearch single-node cluster** - indexer for Wazuh data
- **Wazuh manager** - real or local build depending on `--server`/`--server-local` flags
- **OpenSearch Dashboards dev environment** - bootstrapped with pre-compiled node modules
- **Wazuh agents** (optional) - deployed with `-a deb|rpm`, or 2 agents by default with `--server-local`
- **Imposter** - mock server for testing
- **Elasticsearch-exporter** - metrics adapter for Prometheus

## Notes

- For Elasticsearch/Kibana-based environments, use [docker/kbn-dev](../../docker/kbn-dev).
- Ensure the plugin branch matches your target OpenSearch Dashboards version.
- Use `--server <version>` for a real Wazuh server release (e.g., `--server 4.7.2`).
- Use `--server-local <tag>` to test local Wazuh manager builds (place `.deb` packages in `docker/osd-dev/manager/`).
- Use `--indexer-local <tag>` to test local Wazuh indexer builds (place `.deb` package in `docker/osd-dev/indexer/`).
