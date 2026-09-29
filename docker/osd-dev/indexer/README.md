# Indexer

This directory contains the files required to run a Wazuh indexer container using a package.

## Contents

- **Dockerfile**: Defines the Docker image for Wazuh indexer.
- **entrypoint.sh**: Entrypoint script to initialize the container.
- **installer.sh**: Script used to automate the installation and configuration of Wazuh indexer and its dependencies inside the container.

## Credentials

The package's `postinst` runs `resolve-credentials.sh --install`, which would
generate random passwords, mint a bootstrap CA and issue certificates for the
build container. Its password policy (12-64 characters with upper and lower
case, a digit and a symbol) also rejects the fixed development passwords. So
the image skips it: `installer.sh` creates the resolver's initialisation marker
(`/var/lib/wazuh-indexer/.initialized`) before installing the package, and keeps
`internal_users.yml` with its password placeholders as
`internal_users.yml.template`. Nothing runs the resolver later either, since
only the systemd unit calls `--prestart`.

On every start, `entrypoint.sh`:

- rebuilds `internal_users.yml` from the template, hashing these passwords with
  the security plugin's `hash.sh`:

  | Variable                        | User            | Default         |
  | ------------------------------- | --------------- | --------------- |
  | `INDEXER_ADMIN_PASSWORD`        | `admin`         | `admin`         |
  | `INDEXER_KIBANASERVER_PASSWORD` | `kibanaserver`  | `kibanaserver`  |
  | `INDEXER_MANAGER_PASSWORD`      | `wazuh-manager` | `wazuh-manager` |

- fills `plugins.security.nodes_dn` and `plugins.security.authcz.admin_dn` in
  `opensearch.yml` with the subjects of the mounted `certs/indexer.pem` and
  `certs/admin.pem`, which the `generator` service issues;
- loads the configuration with `securityadmin.sh`.

To change a password, set the variable and recreate the container. The
dashboard (`kibanaserver`), the manager (`INDEXER_PASSWORD`) and the exporter
read their own copies, so update those too.

## Usage

### Recommended: Using `dev.sh`

The preferred way to start the development environment is with the `dev.sh` script located in the parent directory. For example:

```bash
./dev.sh /absolute/path/to/wazuh_app_src up
```

You can pass additional options and profiles (e.g., `saml`, `server`). Run `./dev.sh` without arguments to see usage instructions.

### Manual

1. Build the Docker image:

   ```bash
   docker build -t wazuh-indexer .
   ```

2. Run the container:

   ```bash
   docker run -d --name wazuh-indexer wazuh-indexer
   ```

3. Customize the configuration by editing the files in the `config/` directory before building the image.

## Notes

- This environment is intended for development and testing, not for production use.
- Make sure to review and adapt the configurations as needed.
