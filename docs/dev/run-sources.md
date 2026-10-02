# How to run from sources

The recommended way to run the plugins from source is using the Docker-based
development environments in the `docker/` directory of the repository. These environments include
a Wazuh indexer (`quay.io/wazuh/wazuh-indexer`), Wazuh manager, OpenSearch Dashboards development
environment, optional Wazuh agents (with `-a` flag), and supporting services
(Imposter mock server, Elasticsearch-exporter).

## Start the OpenSearch Dashboards dev environment

1. Review the prerequisites in `docker/osd-dev/README.md`.
2. Start the environment from the repository root:

```bash
cd docker/osd-dev
./dev.sh up
```

The script auto-detects versions from `plugins/wazuh-core/package.json` and
internal plugins from `plugins/`: `-os` (Wazuh indexer image tag) defaults to `<version>-latest`
and `-osd` (OpenSearch Dashboards version) to `pluginPlatform.version`. For specific versions:

```bash
./dev.sh up -os 5.0.0-latest -osd 3.6.0
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

See `docker/osd-dev/README.md` for all available
options, including `--server`, `--indexer-local`, external plugin mappings, `--mailpit` (optional
Mailpit email testing service), `--base`/`-r` (external repository mappings, resolved from
`<common-parent-directory>`), `--plugins-root` (aliases `-wdp`, `--wz-home`; where internal plugins
are read from when not auto-detected). The scripts read a `PORT` variable for the dashboard's
exposed port, but `dev.sh` does not forward it into the script container
(`scripts/dev-ts.yml`), so the port is always `5601`.

Before the first `./dev.sh up`, two external Docker networks must already exist — Compose fails
otherwise, since `dev.yml` declares them `external: true`:

```bash
docker network create devel
docker network create mon
```

Also set `vm.max_map_count=262144` (required by the indexer to avoid out-of-memory errors; see
`docker/osd-dev/README.md` for the `sysctl` command), install `nvm` for the Node.js version used
by the dev scripts, and set `GIT_REF` when installing `plugins/main`'s dependencies directly
(outside the container) — see [Build from sources](build-sources.md). `dev.yml` also has a commented-out
Loki logging driver option for centralized container logs, disabled by default.

3. Attach a shell to the development container:

```bash
docker ps
docker exec -it <CONTAINER_ID> bash
```

4. From the container shell, start the dev server:

```bash
yarn start --no-base-path
```

If dependencies are missing, install them from the `/home/node/kbn/plugins/<name>` directory inside
the container (see `docker/osd-dev/README.md`).

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

- Ensure the plugin branch matches your target OpenSearch Dashboards version.
- Use `--server <version>` for a real Wazuh server release; the version is a
  `wazuh/wazuh-manager` Docker Hub tag (e.g., `--server 5.0.0-beta5` — `5.0.0` itself is not
  published yet, and `4.7.2` is a 4.x manager, incompatible with this 5.x dashboard).
- Use `--server-local <tag>` to test local Wazuh manager builds (place `.deb` packages in `docker/osd-dev/manager/`).
- Use `--indexer-local <tag>` to test local Wazuh indexer builds (place `.deb` package in `docker/osd-dev/indexer/`).
