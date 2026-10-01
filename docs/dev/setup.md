# Set up the development environment

This guide covers the minimum toolchain and editor setup for working on the
Wazuh dashboard plugins.

## Setup the toolchain

Prerequisites:

- Git
- Node.js (use the version in `.nvmrc` at the repository root)
- Yarn classic (v1)
- Docker Desktop — not needed for editing code alone, but recommended to run the dev server, build,
  or run tests: the canonical dev/test environment is Docker (see [Run from sources](run-sources.md)
  and [Run the tests](run-tests.md)). Jest (`plugins/*/scripts/jest.js`, which loads OSD's
  `src/setup_node_env`) and `yarn build` (OSD's `scripts/plugin_helpers`) need the plugins inside an
  OpenSearch Dashboards source tree, which the Docker environment provides; a host build in a
  `wazuh-dashboard` checkout also works (see [Build packages](build-packages.md)).

Install and select Node.js with nvm:

```bash
nvm install $(cat .nvmrc)
nvm use $(cat .nvmrc)
```

Install dependencies for the in-repo plugins:

```bash
for plugin in plugins/main plugins/wazuh-core plugins/wazuh-check-updates plugins/wazuh-ai-assistant; do
	(cd "$plugin" && yarn)
done
```

> Note: the `main` plugin downloads indexer resources during install. Ensure the
> referenced `wazuh-indexer-plugins` Git ref exists. See
> [Get external resources](get-external-resources.md).

## Setup the editor/debugger

Recommended editor setup:

- VS Code
- Enable ESLint and Prettier formatting

For runtime debugging, use the OpenSearch Dashboards dev server described in
[Run from sources](run-sources.md). This provides hot reload and browser
debugging for the UI and server-side plugin code.
