# How to generate a container image

The development environment in [docker/osd-dev](../../docker/osd-dev) runs the
`quay.io/wazuh/osd-dev` image. This repository does not contain the recipe for
that image: the Dockerfile and the build script are in the `wazuh-dashboard`
repository, under `dev-tools/build-dev-image`. The
`dev-tools/build-dev-image/README.md` file at the `wazuh-dashboard` repository
documents every build option.

## Prerequisites

- Docker Desktop or Docker Engine, with the `buildx` plugin
- QEMU, to build images for an architecture other than the host one
- Access to the internet for base image downloads
- A local clone of the `wazuh-dashboard` repository

## Build an OpenSearch Dashboards dev image

From the root of the `wazuh-dashboard` repository:

```bash
cd dev-tools/build-dev-image
./build-multiarch.sh \
	--node-version "$(cat ../../.nvmrc)" \
	--opensearch-version 3.6.0.0 \
	--wazuh-branch 5.0.0 \
	--plugins-branch 5.0.0 \
	--platform linux/amd64 \
	--tag 3.6.0
```

Replace the OpenSearch Dashboards version, the branches, and the tag with the
values of your target. The branch options that are not set (`--security-branch`,
`--reporting-branch`, and the rest) default to `main`. The script builds a local
image by default. Add `--push` to publish it to the registry.

The script builds for `linux/amd64,linux/arm64` by default. A local build of
several platforms fails on the classic Docker image store, so the example sets
`--platform` to one platform. Set it to the architecture of your host. When you
publish the image with `--push`, you can omit `--platform` to build both.

## Use the image

The development environment runs the `quay.io/wazuh/osd-dev:<osd_version>`
image. The `-osd <osd_version>` option of `docker/osd-dev/dev.sh` selects the
tag; without it, the version in `plugins/wazuh-core/package.json` is used. See
[docker/osd-dev/README.md](../../docker/osd-dev/README.md) for the available
options.
