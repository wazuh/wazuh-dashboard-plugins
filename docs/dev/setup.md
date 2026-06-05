# Setup the development environment

This guide covers the minimum toolchain and editor setup for working on the
Wazuh dashboard plugins.

## Setup the toolchain

Prerequisites:

- Git
- Node.js (use the version in [.nvmrc](../../.nvmrc))
- Yarn classic (v1)
- Docker Desktop (optional, required for the docker-based dev environments)

Install and select Node.js with nvm:

```bash
nvm install $(cat .nvmrc)
nvm use $(cat .nvmrc)
```

Install dependencies for the in-repo plugins:

```bash
for plugin in plugins/main plugins/wazuh-core plugins/wazuh-check-updates; do
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
[Run from Sources](run-sources.md). This provides hot reload and browser
debugging for the UI and server-side plugin code.
