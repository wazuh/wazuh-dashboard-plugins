# How to generate a container image

This repository provides Dockerfiles for development images under
[docker/images](../../docker/images). Use these to build local images that
match the OpenSearch Dashboards version you are targeting.

## Prerequisites

- Docker Desktop or Docker Engine
- Access to the internet for base image downloads

## Build an OpenSearch Dashboards dev image

From the repository root:

```bash
cd docker/images
docker build \
	--build-arg NODE_VERSION=$(cat ../../.nvmrc) \
	--build-arg OPENSEARCH_VERSION=3.3.0 \
	-t quay.io/wazuh/osd-dev:3.3.0 \
	-f osd-dev.Dockerfile .
```

Adjust `OPENSEARCH_VERSION` and the output tag as needed for your target.

## Examples:

For additional image recipes and examples, see [docker/README.md](../../docker/README.md).
