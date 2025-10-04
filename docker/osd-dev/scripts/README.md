# Development Scripts - TypeScript

This directory contains the TypeScript-based development scripts for the Wazuh Dashboard Plugins development environment.

## Structure

```
scripts/
├── dev.ts           # Main development script (migrated from dev.sh)
├── Dockerfile       # Container image for running TypeScript
├── dev-ts.yml       # Docker Compose configuration for the dev script
├── package.json     # TypeScript dependencies
└── README.md        # This file
```

## Overview

The development workflow has been migrated from bash (`dev.sh`) to TypeScript (`dev.ts`). The `dev.sh` file now acts as a simple wrapper that:

1. Builds the TypeScript container image
2. Runs the TypeScript script inside Docker
3. Passes all arguments to the TypeScript script

## How It Works

### Original Workflow

```
dev.sh → bash logic → docker compose
```

### New Workflow

```
dev.sh → docker compose (dev-ts.yml) → dev.ts → docker compose (dev.yml)
```

## Benefits

- **Type Safety**: TypeScript provides compile-time type checking
- **Maintainability**: Better code organization and error handling
- **Consistency**: Same Docker-based approach for all tooling
- **Extensibility**: Easier to add new features with TypeScript's ecosystem

## Usage

The `dev.sh` wrapper remains the entry point. The action is positional; everything else must be provided via flags.

```bash
./dev.sh <action> \
  [--plugins-root /abs/path]  # aliases: -wdp, --wz-home \
  [-os <os_version>] [-osd <osd_version>] \
  [-a <rpm|deb|without>]  # aliases: none, 0 \
  [-r <repo>=</absolute/path> ...] \
  [-saml | --server <version> | --server-local <tag>] \
  [-base [</absolute/path>]]
```

Examples:

```bash
# Standard environment
./dev.sh up

# With specific OS/OSD versions
./dev.sh up -os 2.11.0 -osd 2.11.0

# External plugins (repeat -r)
./dev.sh up -r wazuh-dashboard-reporting=/path/to/repo
./dev.sh up -r wazuh-dashboard-reporting   # shorthand: resolves /sibling/wazuh-dashboard-reporting

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

## Migration Notes

All functionality from the original bash script has been preserved:

- ✅ OS/OSD version detection from package.json
- ✅ Repository path resolution (default and explicit)
- ✅ External repository mounting
- ✅ Dynamic compose override generation
- ✅ Profile-based deployment (standard, saml, server, server-local)
- ✅ Agent deployment options
- ✅ All docker compose actions (up, down, start, stop, manager-local-up)
