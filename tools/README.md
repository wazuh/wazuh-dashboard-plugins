# Tools Directory Documentation

## repository_bumper.sh

The `repository_bumper.sh` script is a utility designed to automate version and stage updates across the Wazuh Dashboard Plugins repository. Below is a detailed explanation of its components and usage.

### Purpose

This script simplifies the process of updating version numbers, stages, and related metadata in various files within the repository. It ensures consistency and reduces the risk of manual errors during version updates.

### Key Features

- **Version and Stage Updates**: Updates version and stage information in JSON and YAML files.
- **Documentation URL Updates**: Modifies documentation URLs in `endpoints.json`.
- **Changelog Management**: Automatically updates the `CHANGELOG.md` file with new version details.
- **Docker Configuration Updates**: Updates the `specFile` URL in `docker/imposter/wazuh-config.yml`.
- **Validation and Logging**: Validates inputs and logs all operations for traceability.

### Script Components

#### 1. Global Variables

- `SCRIPT_PATH`, `REPO_PATH`: Determine the script and repository paths.
- `VERSION`, `STAGE`: Store the version and stage provided as arguments.
- `LOG_FILE`: Path to the log file for recording operations.

#### 2. Helper Functions

- **`log`**: Logs messages with timestamps.
- **`usage`**: Displays usage instructions.
- **`update_json`**: Updates JSON files using `jq`.
- **`update_yaml`**: Updates YAML files using `yq`.
- **`update_endpoints_json`**: Updates documentation URLs in `endpoints.json`.
- **`update_imposter_config`**: Updates the `specFile` URL in `wazuh-config.yml`.

#### 3. Core Logic Functions

- **`parse_arguments`**: Parses command-line arguments.
- **`validate_input`**: Validates the provided version and stage.
- **`pre_update_checks`**: Performs pre-update checks and gathers initial data.
- **`compare_versions_and_set_revision`**: Compares versions and determines the revision number.
- **`update_root_version_json`**: Updates the root `VERSION.json` file.
- **`update_package_json_files`**: Updates `package.json` files in the repository.
- **`update_osd_json_files`**: Updates `opensearch_dashboards.json` files.
- **`update_changelog`**: Updates the `CHANGELOG.md` file with new version details.

#### 4. Main Execution

The `main` function orchestrates the script's execution by:

1. Parsing and validating arguments.
2. Performing pre-update checks.
3. Updating various files (e.g., `VERSION.json`, `package.json`).
4. Logging all operations.

### Usage

Run the script with the following syntax:

```bash
./repository_bumper.sh --version VERSION --stage STAGE
```

#### Parameters

- `--version VERSION`: Specify the version (e.g., `4.6.0`).
- `--stage STAGE`: Specify the stage (e.g., `alpha0`, `beta1`, `rc2`).
- `--help`: Display help information.

#### Examples

```bash
./repository_bumper.sh --version 4.6.0 --stage alpha0
./repository_bumper.sh --version 4.6.0 --stage beta1
```

### Prerequisites

- **jq**: Ensure `jq` is installed for JSON file manipulation.
- **yq**: Ensure `yq` is installed for YAML file manipulation.

### Log File

All operations are logged in a file named `repository_bumper_<timestamp>.log` located in the same directory as the script.

### Notes

- Ensure the script is executed from within the repository.
- The script performs extensive validation to prevent errors but requires proper permissions to modify files.

For more details, refer to the script source code.
