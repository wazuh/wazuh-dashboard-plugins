#!/bin/bash
#
# Wazuh Dashboard Plugins repository bumper (Pure Shell Version)
# This script automates version and stage bumping across the repository using only shell commands.

set -e

# Script path
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Determine repository root using git
REPO_PATH=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_PATH" ]; then
  echo "ERROR: Failed to determine repository root. Ensure you are inside the git repository." >&2
  exit 1
fi
DATE_TIME=$(date "+%Y-%m-%d_%H-%M-%S-%3N")
LOG_FILE="${SCRIPT_PATH}/repository_bumper_${DATE_TIME}.log"

# Create log file
touch "$LOG_FILE"

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

# Parse command-line arguments
VERSION=""
STAGE=""

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
    echo "Unknown option: $1"
    usage
    exit 1
    ;;
  esac
done

# Validate required parameters
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

# Validate version format
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  log "ERROR: Version must be in the format x.y.z (e.g., 4.6.0)"
  exit 1
fi

# Validate stage format (allow alphanumeric)
if ! [[ $STAGE =~ ^[a-zA-Z]+[0-9]*$ ]]; then
  log "ERROR: Stage must be alphanumeric (e.g., alpha0, beta1, rc2)"
  exit 1
fi

log "Starting repository bump process"
log "Version: $VERSION"
log "Stage: $STAGE"
log "Repository path: $REPO_PATH"

# --- Pre-update checks and data gathering ---
MAIN_PACKAGE_JSON="${REPO_PATH}/plugins/main/package.json"
if [ ! -f "$MAIN_PACKAGE_JSON" ]; then
  log "ERROR: Main package.json not found at $MAIN_PACKAGE_JSON"
  exit 1
fi

# Check if jq is installed early
if ! command -v jq &>/dev/null; then
  log "ERROR: jq command could not be found. Please install jq (https://stedolan.github.io/jq/download/)."
  exit 1
fi

# Read current version from main package.json BEFORE updating it
CURRENT_VERSION=$(jq -r '.version' "$MAIN_PACKAGE_JSON")
if [ -z "$CURRENT_VERSION" ] || [ "$CURRENT_VERSION" == "null" ]; then
  log "ERROR: Could not read current version from $MAIN_PACKAGE_JSON"
  exit 1
fi
log "Current version detected in package.json: $CURRENT_VERSION"

# Extract major.minor from current and new versions
CURRENT_MAJOR_MINOR=$(echo "$CURRENT_VERSION" | cut -d. -f1,2)
NEW_MAJOR_MINOR=$(echo "$VERSION" | cut -d. -f1,2)
log "Current major.minor: $CURRENT_MAJOR_MINOR"
log "New major.minor: $NEW_MAJOR_MINOR"

# --- Version Comparison ---
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
  log "Version check passed: New version ($VERSION) is greater than current version ($CURRENT_VERSION)."
else
  # Major versions are equal, compare Minor version
  if ((${NEW_VERSION_PARTS[1]} < ${CURRENT_VERSION_PARTS[1]})); then
    log "ERROR: New minor version (${NEW_VERSION_PARTS[1]}) cannot be lower than current minor version (${CURRENT_VERSION_PARTS[1]}) when major versions are the same."
    exit 1
  elif ((${NEW_VERSION_PARTS[1]} > ${CURRENT_VERSION_PARTS[1]})); then
    log "Version check passed: New version ($VERSION) is greater than current version ($CURRENT_VERSION)."
  else
    # Major and Minor versions are equal, compare Patch version
    if ((${NEW_VERSION_PARTS[2]} < ${CURRENT_VERSION_PARTS[2]})); then
      log "ERROR: New patch version (${NEW_VERSION_PARTS[2]}) cannot be lower than current patch version (${CURRENT_VERSION_PARTS[2]}) when major and minor versions are the same."
      exit 1
    else
      # Patch is greater or equal
      log "Version check passed: New version ($VERSION) is greater than or equal to current version ($CURRENT_VERSION)."
    fi
  fi
fi
# --- End Version Comparison ---

# --- End Pre-update checks ---

# Function to update JSON file using sed (basic, assumes simple structure)
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

# Function to update YAML file using sed (basic, assumes simple structure)
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

# Determine the tag suffix based on the stage
# Always add the stage as a suffix now
TAG_SUFFIX="-$STAGE"
log "Tag suffix set to: $TAG_SUFFIX"

# Determine plugins directory
PLUGINS_DIR="${REPO_PATH}/plugins"
if [ ! -d "$PLUGINS_DIR" ]; then
  log "ERROR: Plugins directory not found at $PLUGINS_DIR"
  exit 1
fi

# Calculate revision (typically 00 for a new version/stage)
REVISION="00"
log "Using revision: $REVISION"

# --- File Bumping Logic ---
log "Starting file modifications..."

# Update VERSION.json at the root
VERSION_JSON_FILE="${REPO_PATH}/VERSION.json"
if [ -f "$VERSION_JSON_FILE" ]; then
  log "Processing $VERSION_JSON_FILE"
  update_json "$VERSION_JSON_FILE" "version" "$VERSION"
  update_json "$VERSION_JSON_FILE" "stage" "$STAGE"
else
  log "WARNING: $VERSION_JSON_FILE not found. Skipping update."
fi

# Use git ls-files to find tracked package.json files within the plugins directory, excluding test/cypress/package.json
git ls-files "$PLUGINS_DIR" | grep '/package.json$' | grep -v 'test/cypress/package.json' | while IFS= read -r pkg_file; do
  # Ensure the file path is relative to the repository root or absolute for jq/yq
  full_pkg_path=$(realpath "${pkg_file}")
  log "Processing $full_pkg_path"
  update_json "$full_pkg_path" "version" "$VERSION"
  update_json "$full_pkg_path" "revision" "$REVISION"
done

# Use git ls-files to find tracked wazuh.yml files within the plugins directory
git ls-files "$PLUGINS_DIR" | grep '/wazuh.yml$' | while IFS= read -r yml_file; do
  # Ensure the file path is relative to the repository root or absolute for jq/yq
  full_yml_path=$(realpath "${yml_file}") # Use realpath for consistency
  log "Processing $full_yml_path"
  update_yaml "$full_yml_path" "version" "$VERSION"
done

# Conditionally update endpoints.json if major.minor version changed
if [ "$CURRENT_MAJOR_MINOR" != "$NEW_MAJOR_MINOR" ]; then
  log "Major.minor version changed ($CURRENT_MAJOR_MINOR -> $NEW_MAJOR_MINOR). Updating endpoints.json..."
  update_endpoints_json "$CURRENT_MAJOR_MINOR" "$NEW_MAJOR_MINOR"
else
  log "Major.minor version ($CURRENT_MAJOR_MINOR) remains the same. Skipping endpoints.json update."
fi

# Update docker/imposter/wazuh-config.yml specFile URL
log "Updating docker/imposter/wazuh-config.yml..."
update_imposter_config "$VERSION"

# --- Update CHANGELOG.md Start ---
log "Updating CHANGELOG.md..."
CHANGELOG_FILE="${REPO_PATH}/CHANGELOG.md"
PACKAGE_JSON_FILE="${REPO_PATH}/plugins/main/package.json" # Re-read after potential update

# Check if package.json exists
if [ ! -f "$PACKAGE_JSON_FILE" ]; then
  log "ERROR: package.json not found at $PACKAGE_JSON_FILE"
  exit 1
fi

# Extract OpenSearch Dashboards version from package.json
OPENSEARCH_VERSION=$(jq -r '.pluginPlatform.version' "$PACKAGE_JSON_FILE")
if [ -z "$OPENSEARCH_VERSION" ] || [ "$OPENSEARCH_VERSION" == "null" ]; then
  log "ERROR: Could not extract pluginPlatform.version from $PACKAGE_JSON_FILE"
  exit 1
fi
log "Detected OpenSearch Dashboards version: $OPENSEARCH_VERSION"

# Construct the new changelog entry
# Note: Using printf for better handling of newlines and potential special characters
NEW_ENTRY=$(printf "## Wazuh v%s - OpenSearch Dashboards %s - Revision 00\n\n### Added\n\n- Support for Wazuh %s\n" "$VERSION" "$OPENSEARCH_VERSION" "$VERSION")

# Use awk to insert the new entry after the title and description (lines 1-4)
awk -v entry="$NEW_ENTRY" '
NR == 1 { print; next } # Print line 1 (# Change Log)
NR == 2 { print; next } # Print line 2 (blank)
NR == 3 { print; next } # Print line 3 (description)
NR == 4 { print; printf "%s\n\n", entry; next } # Print line 4 (blank) and insert entry
{ print } # Print the rest of the lines starting from line 5
' "$CHANGELOG_FILE" >temp_changelog && mv temp_changelog "$CHANGELOG_FILE" || {
  log "ERROR: Failed to update $CHANGELOG_FILE"
  rm -f temp_changelog # Clean up temp file on error
  exit 1
}
log "CHANGELOG.md updated successfully."
# --- Update CHANGELOG.md End ---

log "File modifications completed."
log "WARNING: API spec data generation (if applicable) needs to be done manually or with other tools."
# --- File Bumping Logic End ---

# log "Repository bump completed successfully"
exit 0
