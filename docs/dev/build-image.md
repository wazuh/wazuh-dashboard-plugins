# How to generate a container image

The development environment in [docker/osd-dev](../../docker/osd-dev) runs the
`quay.io/wazuh/osd-dev:<OSD_VERSION>` image. This image is built from the
[wazuh-dashboard](https://github.com/wazuh/wazuh-dashboard) repository, not from this one.
The Dockerfile (`wzd.dockerfile`) and the build scripts are in
[dev-tools/build-dev-image](https://github.com/wazuh/wazuh-dashboard/tree/5.0.0/dev-tools/build-dev-image).

## Prerequisites

- Docker Desktop or Docker Engine
- The [buildx](https://github.com/docker/buildx) plugin and QEMU, for multi-architecture builds
- Access to the internet for base image downloads

## Build an OpenSearch Dashboards dev image

From the root of a `wazuh-dashboard` checkout:

```bash
cd dev-tools/build-dev-image
./build-multiarch.sh --tag <tag>
```

Replace `<tag>` with the image tag to produce. Use `--push` to publish the image to
`quay.io/wazuh`. The script also accepts the Node.js version, the platform version and the
branch of each plugin repository. See the
[build-dev-image README](https://github.com/wazuh/wazuh-dashboard/blob/5.0.0/dev-tools/build-dev-image/README.md)
for the full list of options and for the equivalent manual `docker build` command.

## Examples

For more about the development environments, see [docker/README.md](../../docker/README.md).
