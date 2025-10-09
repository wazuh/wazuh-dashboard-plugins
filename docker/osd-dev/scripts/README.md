# Development Scripts - TypeScript

This directory contains the TypeScript-based development scripts for the Wazuh Dashboard Plugins development environment.

## Structure

```
scripts/
├── dev.ts           # Main development script
├── Dockerfile       # Container image for running TypeScript
├── dev-ts.yml       # Docker Compose configuration for the dev script
├── package.json     # TypeScript dependencies
└── README.md        # This file
```

## Overview

The development workflow is implemented in TypeScript (`dev.ts`). The `dev.sh` file acts as a simple wrapper that:

1. Builds the TypeScript container image
2. Runs the TypeScript script inside Docker
3. Passes all arguments to the TypeScript script

## How It Works

### Workflow

```
dev.sh → docker compose (dev-ts.yml) → dev.ts → docker compose (dev.yml)
```

## Usage

The `dev.sh` wrapper is the entry point. The action is positional; everything else must be provided via flags.

### About <common-parent-directory>

- Meaning: a host directory where you keep external repositories (e.g., `~/dev`). The script uses it for shorthand `-r <repo>` resolution and for auto‑discovery.
- How it’s set: the wrapper `docker/osd-dev/dev.sh` sets `SIBLING_REPO_HOST_ROOT` to the parent folder of this repo by default. You can override it explicitly:
  - `export SIBLING_REPO_HOST_ROOT=/absolute/path/to/your/common-parent-directory`
  - Then run `./docker/osd-dev/dev.sh …`
- How to verify: `echo $SIBLING_REPO_HOST_ROOT` (must be an absolute host path).
- Note: docs refer to this location as `<common-parent-directory>`.

```bash
./dev.sh <action> \
  [--plugins-root /abs/path]  # aliases: -wdp, --wz-home \
  [-os <os_version>] [-osd <osd_version>] \
  [-a <rpm|deb|without>]  # aliases: none, 0 \
  [-r <repo>=</absolute/path> ...] \
  [-saml | --server <version> | --server-local <tag>] \
  [--base [</absolute/path>]]
```

Notes about `-r`:

- The path must be ABSOLUTE and must point to the repository ROOT. Do not pass subfolders such as `/plugins/...`.
- Shorthand `-r <repo>` resolves from your <common-parent-directory> (a directory where you keep external repos), using the same `<repo>` name.
- In `--base` mode, if you need to override the security plugin, use `-r wazuh-security-dashboards-plugin=/absolute/repo/root`. The script uses the provided path as-is; do not pass the plugin subdirectory.

Examples:

```bash
# Standard environment
./dev.sh up

# With specific OS/OSD versions
./dev.sh up -os 2.11.0 -osd 2.11.0

# External plugins (repeat -r)
./dev.sh up -r wazuh-dashboard-reporting=/path/to/repo
./dev.sh up -r wazuh-dashboard-reporting   # shorthand: resolves /sibling/wazuh-dashboard-reporting

# Accepted security plugin aliases with -r (no auto-descent or search in dashboardBase):
#   wazuh-security-dashboards-plugin | wazuh-security-dashboards | wazuh-security | security

# Accepted forms (path used exactly as provided; no internal resolution):
#   ./dev.sh up -r wazuh-security              # resolves to '<common-parent-directory>/wazuh-security-dashboards-plugin'
#   ./dev.sh up -r security                    # resolves to '<common-parent-directory>/wazuh-security-dashboards-plugin'
#   ./dev.sh up -r wazuh-security-dashboards   # resolves to '<common-parent-directory>/wazuh-security-dashboards-plugin'
#   ./dev.sh up -r wazuh-security-dashboards-plugin  # resolves to '<common-parent-directory>/wazuh-security-dashboards-plugin'
#   ./dev.sh up -r security=/abs/path/wazuh-security-dashboards-plugin  # uses the absolute path as is

# Bring down everything
./dev.sh down

# SAML mode
./dev.sh up -saml

# Server mode
./dev.sh up --server 4.12.0

# Server-local (agents from local packages)
./dev.sh up --server-local my-custom-tag -a rpm

# SAML + Server (flags only)
./dev.sh up -saml --server 4.12.0
./dev.sh up -saml --server-local my-custom-tag
```

## Development

To modify the TypeScript script:

1. Edit `dev.ts`
2. The next run will automatically rebuild the container image
3. Changes are reflected immediately (the script is mounted as a volume)

## Dependencies

The Dockerfile installs:

- Node.js 20 (Alpine)
- TypeScript & ts-node
- Docker CLI & Docker Compose
- jq (for JSON parsing)

## Technical Details

### Docker Compose Configuration

The `dev-ts.yml` file configures:

- Socket mounting (`/var/run/docker.sock`) to allow Docker-in-Docker
- Volume mounting of the workspace and scripts
- Host network mode for seamless container communication

### TypeScript Script

The `dev.ts` script includes:

- Argument parsing and validation
- Repository path resolution
- Dynamic Docker Compose override generation
- Environment variable management
- Docker Compose execution with appropriate profiles
