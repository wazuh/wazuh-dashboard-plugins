# Development Documentation

See [Setup Environment](setup.md) for the full toolchain prerequisites (Node.js, Yarn, Docker) and
per-plugin dependency installation. The steps below cover the repository-root setup only.

## First time setup

> [!IMPORTANT]
> You must stay at the root of the project.

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

This command will lint the code on the changed files.

## Formatting

`yarn format` does not exist at the repository root either — run it from the relevant plugin's own
folder the same way:

```bash
cd plugins/main
yarn format
```

This command will format the code on the changed files.
