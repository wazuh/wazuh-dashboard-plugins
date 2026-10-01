# How to build from sources

This guide explains how to build the plugins from this repository into
distributable ZIP packages for development or manual installation.

> **Note**: This guide builds **only the plugins** in this repository. If you
> need complete system packages (DEB/RPM) including the full dashboard
> distribution, see [Build packages](build-packages.md).

## Prerequisites

- Toolchain configured as described in [Set up environment](setup.md)
- `jq` installed (used to read plugin versions)
- Git reference (branch or tag) from the `wazuh-indexer-plugins` repository, compatible with your
  plugin version
- A `wazuh-dashboard` source tree to build in: the Docker dev environment (see
  [Run from sources](run-sources.md)) or a host checkout (see [Build packages](build-packages.md))

## Install dependencies

If you haven't already installed dependencies (from [Set up environment](setup.md)),
do so now:

```bash
# Set GIT_REF to a compatible wazuh-indexer-plugins branch/tag.
# Its branches are named after the product version, so use the plugin version.
export GIT_REF=$(jq -r .version plugins/main/package.json)

# Install dependencies for main plugin (downloads indexer resources)
cd plugins/main
GIT_REF=$GIT_REF yarn
cd ../..

# Install dependencies for other plugins
for plugin in plugins/wazuh-core plugins/wazuh-check-updates plugins/wazuh-ai-assistant; do
	(cd "$plugin" && yarn)
done
```

> **Important**: The `main` plugin requires `GIT_REF` during installation to
> download resources from the wazuh-indexer-plugins repository. Ensure the
> referenced branch or tag exists and is compatible with your plugin version.

## Build the plugins

Each plugin must be built with the OpenSearch Dashboards version. The commands below read it only
once, from `plugins/main/package.json`, and reuse that value for every plugin — all 4 plugins
declare the same `pluginPlatform.version`, so this is not a per-plugin read.

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

cd plugins/wazuh-ai-assistant
OPENSEARCH_DASHBOARDS_VERSION=$OPENSEARCH_DASHBOARDS_VERSION yarn build
cd ../..
```

The build artifacts (ZIP files) are named `<id>-<OSD version>.zip` (the plugin id from
`opensearch_dashboards.json`, not the plugin's own `5.0.0-NN` version) and are written to each
plugin's `build/` directory:

- `plugins/main/build/wazuh-<OSD version>.zip`
- `plugins/wazuh-core/build/wazuhCore-<OSD version>.zip`
- `plugins/wazuh-check-updates/build/wazuhCheckUpdates-<OSD version>.zip`
- `plugins/wazuh-ai-assistant/build/wazuhAiAssistant-<OSD version>.zip`

## Build inside Docker

`yarn build` runs `node ../../scripts/plugin_helpers`, so the plugins must sit inside an
OpenSearch Dashboards (`wazuh-dashboard`) source tree. The Docker-based development environment
provides one: use [Run from sources](run-sources.md) to start the environment and attach a
shell, then execute the install and build steps above from within the
container. Docker is not strictly required: the host flow in [Build packages](build-packages.md)
copies the plugins into a `wazuh-dashboard` checkout and builds them there.

## Next steps

- To install these plugins manually, see the installation guide in the reference
  manual.
- If you need complete system packages (DEB/RPM) for distribution, see
  [Build packages](build-packages.md).
