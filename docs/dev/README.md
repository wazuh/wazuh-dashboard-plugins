# Development documentation

## Requirements

- [Node.js](https://nodejs.org/en/) (see [.nvmrc](../../.nvmrc))
- [Yarn](https://yarnpkg.com/)

## First time setup

> [!IMPORTANT]
> You must be stay at the root of the project.

```bash
yarn install
```

This command will install all the dependencies needed to lint and format the code on the changed files. And prepare the environment to run the pre-commit hook.

## Linting

```bash
yarn lint
```

This command will lint the code on the changed files.

## Formatting

```bash
yarn format
```

This command will format the code on the changed files.
