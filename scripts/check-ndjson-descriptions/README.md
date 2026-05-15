# check-ndjson-descriptions

Validates and fixes the `attributes.description` field in all `.ndjson` files.

## Why

Wazuh dashboard saved objects (dashboards, visualizations) are distributed as `.ndjson` files. The `description` field is used to identify Wazuh owned dashboards and visualization objects, every description must start with `"Provided by Wazuh. "` so they can be reliably targeted by filters.

## Usage

Run from the project root:

```sh
# Check — report violations and exit 1 if any are found
node scripts/check-ndjson-descriptions/index.mjs

# Fix — rewrite files in place, adding the prefix where missing
node scripts/check-ndjson-descriptions/index.mjs --fix

# Restrict to specific files (e.g. from a git hook)
node scripts/check-ndjson-descriptions/index.mjs --files path/to/file.ndjson path/to/other.ndjson
```

Or via yarn from `plugins/main/`:

```sh
yarn check:ndjson-descriptions
yarn fix:ndjson-descriptions
```

## What it checks

For every JSON object in every `.ndjson` file, the script checks that `attributes.description` exists and starts with `"Provided by Wazuh. "`. Objects where the field is missing, `null`, empty, or has a different prefix are all flagged.

In fix mode the prefix is prepended:

| Before                       | After                                           |
| ---------------------------- | ----------------------------------------------- |
| `""`                         | `"Provided by Wazuh. "`                         |
| `"HIPAA overview dashboard"` | `"Provided by Wazuh. HIPAA overview dashboard"` |
| _(field absent)_             | `"Provided by Wazuh. "`                         |

Running `--fix` multiple times is safe, it will not duplicate the prefix.
