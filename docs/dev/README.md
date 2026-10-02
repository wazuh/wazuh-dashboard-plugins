# Development documentation

See [Set up environment](setup.md) for the full toolchain prerequisites (Node.js, Yarn, Docker) and
per-plugin dependency installation. The steps below cover the repository-root setup only.

## First time setup

> **Important:** You must stay at the root of the project.

```bash
yarn install
```

This installs only `husky`, `lint-staged`, and `prettier` — the root `package.json` has no `lint`
or `format` script. It prepares the environment to run the pre-commit hook, which runs Prettier on
the changed files.

## Linting

`yarn lint` does not exist at the repository root. Run it from the relevant plugin's own folder
instead (`plugins/main`, `plugins/wazuh-core`, `plugins/wazuh-check-updates`, or
`plugins/wazuh-ai-assistant`):

```bash
cd plugins/main
yarn lint
```

This command lints every file under the plugin's `public/`, `server/` and `common/` folders, not
only the changed ones.

## Formatting

`yarn format` does not exist at the repository root either, and only `plugins/main` defines it:

```bash
cd plugins/main
yarn format
```

This command rewrites, with Prettier, every file under `plugins/main`'s `public/`, `server/` and
`common/` folders, not only the changed ones. For the other plugins, run Prettier directly, e.g.
`npx prettier --write <files>` from the repository root.
