# Template Update Script Documentation

## Overview

This script downloads and updates template files from the Wazuh GitHub repository. It specifically updates the `template.json` files in each dataset within the Wazuh Dashboard plugins.

## Requirements

- Node.js
- Internet connection to access GitHub repositories

## Usage

```bash
node update-templates-sample-data.js [--branch=<branch-name>]
```

### Parameters

- `--branch=<branch-name>`: Optional parameter to specify which branch of the Wazuh repository to use for downloading templates. If not provided, the script will use the current version number as the branch name.

### Examples

```bash
# Use the current version as branch (default behavior)
node update-templates-sample-data.js

# Specify a custom branch
node update-templates-sample-data.js --branch=4.5.0
node update-templates-sample-data.js --branch=main
```

## How It Works

1. The script identifies all dataset directories in the local path
2. For each dataset, it downloads the corresponding template from the GitHub repository
3. It saves the downloaded templates to the local directories
4. Provides a summary of successful and failed updates

## Directory Structure

The script looks for datasets in:

```
../server/lib/sample-data/dataset/
```

## Notes

- Datasets must have names starting with "states-" to be recognized
- The vulnerabilities dataset is handled with a special URL
- A summary is displayed at the end of execution showing the results of the update

## Troubleshooting

If you encounter errors while running the script:

1. Check your internet connection
2. Verify that the specified branch exists in the repository
3. Ensure the local directory structure is correct
