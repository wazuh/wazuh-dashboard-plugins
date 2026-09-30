# How to generate a container image

The development environment in [docker/osd-dev](../../docker/osd-dev) runs the
`quay.io/wazuh/osd-dev:<OSD_VERSION>` image. This image is built from the
[wazuh-dashboard](https://github.com/wazuh/wazuh-dashboard) repository, not from this one.

## Prerequisites

- Docker Desktop or Docker Engine
- Access to the internet for base image downloads

## Build an OpenSearch Dashboards dev image

Follow the development image build instructions in the
[wazuh-dashboard](https://github.com/wazuh/wazuh-dashboard) repository.

## Examples

For more about the development environments, see [docker/README.md](../../docker/README.md).
