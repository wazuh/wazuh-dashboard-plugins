#!/bin/bash
#
# Wazuh Dashboard Plugins repository bumper (Pure Shell Version)
# This script automates version and stage bumping across the repository using only shell commands.

set -e

# --- Global Variables ---
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_PATH=$(git rev-parse --show-toplevel 2>/dev/null)
DATE_TIME=$(date "+%Y-%m-%d_%H-%M-%S-%3N")
LOG_FILE="${SCRIPT_PATH}/repository_bumper_${DATE_TIME}.log"
VERSION=""
STAGE=""
REVISION="00"
CURRENT_VERSION=""
CURRENT_MAJOR_MINOR=""
NEW_MAJOR_MINOR=""
COMBINED_VERSION_REVISION=""
OPENSEARCH_VERSION=""

# Create log file
touch "$LOG_FILE"

# --- Helper Functions ---

# Function to log messages
log() {
  local message="$1"
  local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  echo "[${timestamp}] ${message}" | tee -a "$LOG_FILE"
}

# Function to show usage
usage() {
  echo "Usage: $0 --version VERSION --stage STAGE [--help]"
  echo ""
  echo "Parameters:"
  echo "  --version VERSION   Specify the version (e.g., 4.6.0)"
  echo "  --stage STAGE       Specify the stage (e.g., alpha0, beta1, rc2, etc.)"
  echo "  --help              Display this help message"
  echo ""
  echo "Example:"
  echo "  $0 --version 4.6.0 --stage alpha0"
  echo "  $0 --version 4.6.0 --stage beta1"
}

# Function to update JSON file using jq
update_json() {
  local file="$1"
  local key="$2"
  local value="$3"
  log "Updating $key to $value in $file using jq"

  # Use jq to update the key. The '.key = value' syntax updates the key at the top level.
  # Read the file, apply the filter, and write to a temporary file, then replace the original.
  jq --arg key "$key" --arg value "$value" '.[$key] = $value' "$file" >"${file}.tmp" && mv "${file}.tmp" "$file" && log "Successfully updated $file" || {
    log "ERROR: Failed to update $key in $file using jq."
    rm -f "${file}.tmp" # Clean up temp file on error
    exit 1
  }
}

# Function to update YAML file using yq
update_yaml() {
  local file="$1"
  local key="$2"
  local value="$3"
  log "Updating $key to $value in $file using yq"

  # Check if yq is installed
  if ! command -v yq &>/dev/null; then
    log "ERROR: yq command could not be found. Please install yq (https://github.com/mikefarah/yq)."
    exit 1
  fi

  # Use yq to update the key. The 'e' flag evaluates the expression, '.' selects the root,
  # .$key selects the key, = assigns the value. The '-i' flag modifies the file in-place.
  yq e ".${key} = \"${value}\"" -i "$file" && log "Successfully updated $file" || {
    log "ERROR: Failed to update $key in $file using yq."
    # Attempt to restore from backup if yq created one (though -i usually doesn't)
    # Or handle the error more robustly depending on yq version/behavior
    exit 1
  }
}

# Function to update documentation URLs in endpoints.json
update_endpoints_json() {
  local old_doc_version="$1"
  local new_doc_version="$2"
  local endpoints_file="${REPO_PATH}/plugins/main/common/api-info/endpoints.json"

  if [ ! -f "$endpoints_file" ]; then
    log "WARNING: $endpoints_file not found. Skipping documentation URL update."
    return
  fi

  log "Updating documentation URLs in $endpoints_file from $old_doc_version to $new_doc_version"

  # Use sed to replace the version string within the documentation URLs
  # Escape dots in the version strings for sed
  local escaped_old_version=$(echo "$old_doc_version" | sed 's/\./\\./g')
  local escaped_new_version=$(echo "$new_doc_version" | sed 's/\./\\./g')

  sed -i "s|documentation.wazuh.com/${escaped_old_version}|documentation.wazuh.com/${escaped_new_version}|g" "$endpoints_file" && log "Successfully updated documentation URLs in $endpoints_file" || {
    log "ERROR: Failed to update documentation URLs in $endpoints_file using sed."
    # Consider adding error handling or attempting to restore a backup if needed
    exit 1
  }
}

# Function to update specFile URL in docker/imposter/wazuh-config.yml
update_imposter_config() {
  local new_version="$1"
  local imposter_config_file="${REPO_PATH}/docker/imposter/wazuh-config.yml"

  if [ ! -f "$imposter_config_file" ]; then
    log "WARNING: $imposter_config_file not found. Skipping specFile URL update."
    return
  fi

  log "Updating specFile URL in $imposter_config_file to version $new_version"

  # Use sed to replace the version string within the specFile URL
  # This regex targets the version part (e.g., 4.13.0) in the specific URL structure
  sed -i -E "s|(specFile: https://raw.githubusercontent.com/wazuh/wazuh/)[0-9]+\.[0-9]+\.[0-9]+(.*)|\1${new_version}\2|" "$imposter_config_file" && log "Successfully updated specFile URL in $imposter_config_file" || {
    log "ERROR: Failed to update specFile URL in $imposter_config_file using sed."
    # Consider adding error handling or attempting to restore a backup if needed
    exit 1
  }
}

# --- Core Logic Functions ---

parse_arguments() {
  while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
    --version)
      VERSION="$2"
      shift 2
      ;;
    --stage)
      STAGE="$2"
      shift 2
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      log "ERROR: Unknown option: $1" # Log error instead of just echo
      usage
      exit 1
      ;;
    esac
  done
}

# Function to validate input parameters
validate_input() {
  if [ -z "$VERSION" ]; then
    log "ERROR: Version parameter is required"
    usage
    exit 1
  fi
  if [ -z "$STAGE" ]; then
    log "ERROR: Stage parameter is required"
    usage
    exit 1
  fi
  if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    log "ERROR: Version must be in the format x.y.z (e.g., 4.6.0)"
    exit 1
  fi
  if ! [[ $STAGE =~ ^[a-zA-Z]+[0-9]*$ ]]; then
    log "ERROR: Stage must be alphanumeric (e.g., alpha0, beta1, rc2)"
    exit 1
  fi
  # Check for jq early
  if ! command -v jq &>/dev/null; then
    log "ERROR: jq command could not be found. Please install jq (https://stedolan.github.io/jq/download/)."
    exit 1
  fi
}

# Function to perform pre-update checks and gather initial data
pre_update_checks() {
  local main_package_json="${REPO_PATH}/plugins/main/package.json"
  if [ ! -f "$main_package_json" ]; then
    log "ERROR: Main package.json not found at $main_package_json"
    exit 1
  fi

  CURRENT_VERSION=$(jq -r '.version' "$main_package_json")
  if [ -z "$CURRENT_VERSION" ] || [ "$CURRENT_VERSION" == "null" ]; then
    log "ERROR: Could not read current version from $main_package_json"
    exit 1
  fi
  log "Current version detected in package.json: $CURRENT_VERSION"

  CURRENT_MAJOR_MINOR=$(echo "$CURRENT_VERSION" | cut -d. -f1,2)
  NEW_MAJOR_MINOR=$(echo "$VERSION" | cut -d. -f1,2)
  log "Current major.minor: $CURRENT_MAJOR_MINOR"
  log "New major.minor: $NEW_MAJOR_MINOR"
  log "Default revision set to: $REVISION" # Log default revision here
}

# Function to compare versions and determine revision
compare_versions_and_set_revision() {
  log "Comparing new version ($VERSION) with current version ($CURRENT_VERSION)..."

  # Split versions into parts using '.' as delimiter
  IFS='.' read -r -a NEW_VERSION_PARTS <<<"$VERSION"
  IFS='.' read -r -a CURRENT_VERSION_PARTS <<<"$CURRENT_VERSION"

  # Ensure both versions have 3 parts (Major.Minor.Patch)
  if [ ${#NEW_VERSION_PARTS[@]} -ne 3 ] || [ ${#CURRENT_VERSION_PARTS[@]} -ne 3 ]; then
    log "ERROR: Invalid version format detected during comparison. Both versions must be x.y.z."
    exit 1
  fi

  # Compare Major version
  if ((${NEW_VERSION_PARTS[0]} < ${CURRENT_VERSION_PARTS[0]})); then
    log "ERROR: New major version (${NEW_VERSION_PARTS[0]}) cannot be lower than current major version (${CURRENT_VERSION_PARTS[0]})."
    exit 1
  elif ((${NEW_VERSION_PARTS[0]} > ${CURRENT_VERSION_PARTS[0]})); then
    log "Version check passed: New version ($VERSION) is greater than current version ($CURRENT_VERSION) (Major increased)."
    REVISION="00" # Reset revision on major increase
  else
    # Major versions are equal, compare Minor version
    if ((${NEW_VERSION_PARTS[1]} < ${CURRENT_VERSION_PARTS[1]})); then
      log "ERROR: New minor version (${NEW_VERSION_PARTS[1]}) cannot be lower than current minor version (${CURRENT_VERSION_PARTS[1]}) when major versions are the same."
      exit 1
    elif ((${NEW_VERSION_PARTS[1]} > ${CURRENT_VERSION_PARTS[1]})); then
      log "Version check passed: New version ($VERSION) is greater than current version ($CURRENT_VERSION) (Minor increased)."
      REVISION="00" # Reset revision on minor increase
    else
      # Major and Minor versions are equal, compare Patch version
      if ((${NEW_VERSION_PARTS[2]} < ${CURRENT_VERSION_PARTS[2]})); then
        log "ERROR: New patch version (${NEW_VERSION_PARTS[2]}) cannot be lower than current patch version (${CURRENT_VERSION_PARTS[2]}) when major and minor versions are the same."
        exit 1
      elif ((${NEW_VERSION_PARTS[2]} > ${CURRENT_VERSION_PARTS[2]})); then
        log "Version check passed: New version ($VERSION) is greater than current version ($CURRENT_VERSION) (Patch increased)."
        REVISION="00" # Reset revision on patch increase
      else
        # Versions are identical (Major, Minor, Patch are equal)
        log "New version ($VERSION) is identical to current version ($CURRENT_VERSION). Incrementing revision."
        local main_package_json="${REPO_PATH}/plugins/main/package.json" # Need path again
        local current_revision_val=$(jq -r '.revision' "$main_package_json")
        if [ -z "$current_revision_val" ] || [ "$current_revision_val" == "null" ]; then
          log "ERROR: Could not read current revision from $main_package_json"
          exit 1
        fi
        # Ensure CURRENT_REVISION is treated as a number (remove leading zeros for arithmetic if necessary, handle base 10)
        local current_revision_int=$((10#$current_revision_val))
        local new_revision_int=$((current_revision_int + 1))
        # Format back to two digits with leading zero
        REVISION=$(printf "%02d" "$new_revision_int")
        log "Current revision: $current_revision_val. New revision set to: $REVISION"
      fi
    fi
  fi
  log "Final revision determined: $REVISION"
}

# Function to update VERSION.json
update_root_version_json() {
  local version_json_file="${REPO_PATH}/VERSION.json"
  if [ -f "$version_json_file" ]; then
    log "Processing $version_json_file"
    update_json "$version_json_file" "version" "$VERSION"
    update_json "$version_json_file" "stage" "$STAGE"
  else
    log "WARNING: $version_json_file not found. Skipping update."
  fi
}

# Function to update package.json files
update_package_json_files() {
  local plugins_dir="${REPO_PATH}/plugins"
  log "Updating package.json files..."
  # Use git ls-files to find tracked package.json files within the plugins directory, excluding test/cypress/package.json
  git ls-files "$plugins_dir" | grep '/package.json$' | grep -v 'test/cypress/package.json' | while IFS= read -r pkg_file; do
    # Ensure the file path is relative to the repository root or absolute for jq/yq
    local full_pkg_path
    full_pkg_path=$(realpath "${pkg_file}")
    log "Processing $full_pkg_path"
    update_json "$full_pkg_path" "version" "$VERSION"
    update_json "$full_pkg_path" "revision" "$REVISION"
  done
}

# Function to update wazuh.yml files
update_wazuh_yml_files() {
  local plugins_dir="${REPO_PATH}/plugins"
  log "Updating wazuh.yml files..."
  # Use git ls-files to find tracked wazuh.yml files within the plugins directory
  git ls-files "$plugins_dir" | grep '/wazuh.yml$' | while IFS= read -r yml_file; do
    # Ensure the file path is relative to the repository root or absolute for jq/yq
    local full_yml_path
    full_yml_path=$(realpath "${yml_file}") # Use realpath for consistency
    log "Processing $full_yml_path"
    update_yaml "$full_yml_path" "version" "$VERSION"
  done
}

# Function to update opensearch_dashboards.json files
update_osd_json_files() {
  local plugins_dir="${REPO_PATH}/plugins"
  COMBINED_VERSION_REVISION="${VERSION}-${REVISION}"
  log "Combined version-revision string: $COMBINED_VERSION_REVISION"
  log "Updating opensearch_dashboards.json files..."
  # Use git ls-files to find tracked opensearch_dashboards.json files within the plugins directory
  git ls-files "$plugins_dir" | grep '/opensearch_dashboards.json$' | while IFS= read -r osd_json_file; do
    # Ensure the file path is relative to the repository root or absolute for jq/yq
    local full_osd_json_path
    full_osd_json_path=$(realpath "${osd_json_file}")
    log "Processing $full_osd_json_path"
    update_json "$full_osd_json_path" "version" "$COMBINED_VERSION_REVISION"
  done
}

# Function to update CHANGELOG.md
update_changelog() {
  log "Updating CHANGELOG.md..."
  local changelog_file="${REPO_PATH}/CHANGELOG.md"
  local package_json_file="${REPO_PATH}/plugins/main/package.json" # Re-read after potential update

  # Check if package.json exists
  if [ ! -f "$package_json_file" ]; then
    log "ERROR: package.json not found at $package_json_file for changelog update"
    exit 1
  fi

  # Extract OpenSearch Dashboards version from package.json
  OPENSEARCH_VERSION=$(jq -r '.pluginPlatform.version' "$package_json_file")
  if [ -z "$OPENSEARCH_VERSION" ] || [ "$OPENSEARCH_VERSION" == "null" ]; then
    log "ERROR: Could not extract pluginPlatform.version from $package_json_file for changelog"
    exit 1
  fi
  log "Detected OpenSearch Dashboards version for changelog: $OPENSEARCH_VERSION"

  # Construct the new changelog entry
  # Note: Using printf for better handling of newlines and potential special characters
  # Use the calculated REVISION variable here
  local new_entry
  new_entry=$(printf "## Wazuh v%s - OpenSearch Dashboards %s - Revision %s\n\n### Added\n\n- Support for Wazuh %s\n" "$VERSION" "$OPENSEARCH_VERSION" "$REVISION" "$VERSION")

  # Use awk to insert the new entry after the title and description (lines 1-4)
  awk -v entry="$new_entry" '
  NR == 1 { print; next } # Print line 1 (# Change Log)
  NR == 2 { print; next } # Print line 2 (blank)
  NR == 3 { print; next } # Print line 3 (description)
  NR == 4 { print; printf "%s\n\n", entry; next } # Print line 4 (blank) and insert entry
  { print } # Print the rest of the lines starting from line 5
  ' "$changelog_file" >temp_changelog && mv temp_changelog "$changelog_file" || {
    log "ERROR: Failed to update $changelog_file"
    rm -f temp_changelog # Clean up temp file on error
    exit 1
  }
  log "CHANGELOG.md updated successfully."
}

# --- Main Execution ---
main() {
  # Initialize log file
  touch "$LOG_FILE"
  log "Starting repository bump process"

  # Check if inside a git repository early
  if [ -z "$REPO_PATH" ]; then
    # Use log function for consistency, redirect initial error to stderr
    log "ERROR: Failed to determine repository root. Ensure you are inside the git repository." >&2
    exit 1
  fi
  log "Repository path: $REPO_PATH"

  # Parse and validate arguments
  parse_arguments "$@"
  validate_input # This also checks for jq
  log "Version: $VERSION"
  log "Stage: $STAGE"

  # Perform pre-update checks
  pre_update_checks

  # Compare versions and determine revision
  compare_versions_and_set_revision

  # Determine the tag suffix (can be done after STAGE is validated)
  local tag_suffix="-$STAGE" # Use local variable if only needed here
  log "Tag suffix set to: $tag_suffix"

  # Check plugins directory (can be done before file updates)
  local plugins_dir="${REPO_PATH}/plugins"
  if [ ! -d "$plugins_dir" ]; then
    log "ERROR: Plugins directory not found at $plugins_dir"
    exit 1
  fi

  # Start file modifications
  log "Starting file modifications..."

  update_root_version_json
  update_package_json_files
  update_wazuh_yml_files
  update_osd_json_files

  # Conditionally update endpoints.json
  if [ "$CURRENT_MAJOR_MINOR" != "$NEW_MAJOR_MINOR" ]; then
    log "Major.minor version changed ($CURRENT_MAJOR_MINOR -> $NEW_MAJOR_MINOR). Updating endpoints.json..."
    update_endpoints_json "$CURRENT_MAJOR_MINOR" "$NEW_MAJOR_MINOR"
  else
    log "Major.minor version ($CURRENT_MAJOR_MINOR) remains the same. Skipping endpoints.json update."
  fi

  # Update docker/imposter/wazuh-config.yml
  log "Updating docker/imposter/wazuh-config.yml..."
  update_imposter_config "$VERSION"

  # Update CHANGELOG.md
  update_changelog

  log "File modifications completed."
  log "WARNING: API spec data generation (if applicable) needs to be done manually or with other tools."
  log "Repository bump completed successfully. Log file: $LOG_FILE"
  exit 0
}

# Execute main function with all script arguments
main "$@"
