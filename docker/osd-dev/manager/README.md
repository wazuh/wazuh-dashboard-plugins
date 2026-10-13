# Manager

This directory contains the files required to run a Wazuh manager container in the OSD (OpenSearch Dashboards) development environment.

## Contents

- **Dockerfile**: Defines the Docker image for Wazuh manager.
- **entrypoint.sh**: Entrypoint script to initialize the container.
- **installer.sh**: Script used to automate the installation and configuration of Wazuh manager and its dependencies inside the container.
- **wazuh-certs-tool.sh**: Pinned copy of the Wazuh certificate tool (see the header for its origin). The entrypoint runs it to issue the agent-facing HTTPS listener certificate.
- **wazuh-certs.yml**: Node inventory read by `wazuh-certs-tool.sh`.

## Certificates

The manager package does not generate certificates, so the entrypoint issues
them at startup with `wazuh-certs-tool.sh` and installs them under the names the
shipped `wazuh-manager.conf` already expects, leaving that file untouched:

| File                                                 | Read by                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `etc/certs/remoted.pem`, `etc/certs/remoted-key.pem` | `<remote><https>` (the listener agents enroll and report through) and `<auth>` |
| `etc/certs/apid.pem`, `etc/certs/apid-key.pem`       | The Server API (`55000`), through `https.cert` / `https.key` in `api.yaml`     |
| `etc/certs/root-ca.pem`                              | `<remote><https><ca_certificate>`                                              |

Both pairs are the same leaf. The Server API no longer generates a self-signed
certificate and refuses to start (error `2003`) without `apid.pem`; the manager
installer issues that pair with the same profile as `remoted.pem`, so this
environment reuses the listener leaf, as the wazuh devContainer does. Its SAN
covers the addresses agents and the dashboard connect to (`wazuh.manager.local`).

It signs with the root CA the `generator` service publishes into the shared
`wm_certs` volume rather than minting a new one: that CA is the trust anchor the
indexer, the dashboard, imposter and the agents already share. If the CA is
missing the container waits up to 120s and then exits, which usually means the
`generator` service did not run.

To change the certificate's SAN or its filename prefix, edit `wazuh-certs.yml`.

## Credentials

The package's `postinst` runs `wazuh-manager-resolve-credentials --install`,
which seeds `rbac.db` with random Server API passwords, mints a bootstrap CA
(private key included) and issues certificates for the build container.
`installer.sh` removes all of it with `--clear`, as the manager documents for
container images.

The resolver only accepts supplied passwords that pass its policy (12-64
characters with upper and lower case, a digit and a symbol), and the fixed
development ones do not. So, on a container's first start, `entrypoint.sh` seeds
`rbac.db` itself through the same ORM call `rbac_control seed` makes after
validating:

| Variable             | User                    | Default                 |
| -------------------- | ----------------------- | ----------------------- |
| `API_PASSWORD`       | `wazuh-internal-client` | `wazuh-internal-client` |
| `API_WAZUH_PASSWORD` | `wazuh`                 | `wazuh`                 |

It also stores `INDEXER_USERNAME`/`INDEXER_PASSWORD` in the keystore. The
`--prestart` step that `wazuh-manager-control start` runs then finds both
resolved and leaves them alone. A restarted container keeps its `rbac.db`, so
recreate the container to change a password. `API_PASSWORD` is shared with the
agent services, which use it to mint their enrollment tokens.

## Usage

### Recommended: Using `dev.sh`

The preferred way to start the development environment is with the `dev.sh` script located in the parent directory. For example:

```bash
./dev.sh -r external=/absolute/path/to/wazuh-dashboard-external up
```

Or, if you keep all repositories in a single checkout, pass that directory as the optional default root:

```bash
./dev.sh /absolute/path/to/wazuh-dashboard-plugins/plugins up
```

You can pass additional options and profiles (e.g., `saml`, `server`). Run `./dev.sh` without arguments to see usage instructions.

### Manual

1. Build the Docker image:

   ```bash
   docker build -t wazuh-manager .
   ```

2. Run the container:

   ```bash
   docker run -d --name wazuh-manager wazuh-manager
   ```

3. Customize the configuration by editing the files in the `config/` directory before building the image.

## Notes

- This environment is intended for development and testing, not for production use.
- Make sure to review and adapt the configurations as needed.
