# How to build from sources

This guide explains how to build the plugins from this repository into
distributable ZIP packages for development or manual installation.

> **Note**: This guide builds **only the plugins** in this repository. If you
> need complete system packages (DEB/RPM) including the full dashboard
> distribution, see [Build Packages](build-packages.md).

## Prerequisites

- Toolchain configured as described in [Setup Environment](setup.md)
- `jq` installed (used to read plugin versions)
- Git reference (branch or tag) from
  [wazuh-indexer-plugins](https://github.com/wazuh/wazuh-indexer-plugins)
  compatible with your plugin version
- Docker dev environment available (see [Run from Sources](run-sources.md))

## Install dependencies

If you haven't already installed dependencies (from [Setup Environment](setup.md)),
do so now:

```bash
# Set GIT_REF to a compatible wazuh-indexer-plugins branch/tag
export GIT_REF=main

# Install dependencies for main plugin (downloads indexer resources)
cd plugins/main
GIT_REF=$GIT_REF yarn
cd ../..

# Install dependencies for other plugins
for plugin in plugins/wazuh-core plugins/wazuh-check-updates; do
	(cd "$plugin" && yarn)
done
```

> **Important**: The `main` plugin requires `GIT_REF` during installation to
> download resources from the wazuh-indexer-plugins repository. Ensure the
> referenced branch or tag exists and is compatible with your plugin version.

## Build the plugins

Each plugin must be built with the OpenSearch Dashboards version declared in
its `package.json`.

```bash
OPENSEARCH_DASHBOARDS_VERSION=$(jq -r .pluginPlatform.version plugins/main/package.json)

cd plugins/main
OPENSEARCH_DASHBOARDS_VERSION=$OPENSEARCH_DASHBOARDS_VERSION yarn build
cd ../..

cd plugins/wazuh-core
OPENSEARCH_DASHBOARDS_VERSION=$OPENSEARCH_DASHBOARDS_VERSION yarn build
cd ../..

cd plugins/wazuh-check-updates
OPENSEARCH_DASHBOARDS_VERSION=$OPENSEARCH_DASHBOARDS_VERSION yarn build
cd ../..
```

The build artifacts (ZIP files) are written to each plugin's `build/` directory:

- `plugins/main/build/wazuh-<version>.zip`
- `plugins/wazuh-core/build/wazuhCore-<version>.zip`
- `plugins/wazuh-check-updates/build/wazuhCheckUpdates-<version>.zip`

## Build inside Docker

The supported workflow is to run these steps inside the Docker-based
development environment. This ensures the required OpenSearch Dashboards build
helpers are available and the build matches the target platform.

Use [Run from Sources](run-sources.md) to start the environment and attach a
shell, then execute the install and build steps above from within the
container.

## Next steps

- To install these plugins manually, see the installation guide in the reference
  manual.
- If you need complete system packages (DEB/RPM) for distribution, see
  [Build Packages](build-packages.md).
