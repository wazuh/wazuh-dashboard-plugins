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

# Function to update JSON file using sed (basic, assumes simple structure)
update_json() {
  local file="$1"
  local key="$2"
  local value="$3"
  log "Updating $key to $value in $file using jq"

  # Check if jq is installed
  if ! command -v jq &>/dev/null; then
    log "ERROR: jq command could not be found. Please install jq (https://stedolan.github.io/jq/download/)."
    exit 1
  fi

  # Use jq to update the key. The '.key = value' syntax updates the key at the top level.
  # Read the file, apply the filter, and write to a temporary file, then replace the original.
  jq --arg key "$key" --arg value "$value" '.[$key] = $value' "$file" >"${file}.tmp" && mv "${file}.tmp" "$file" || {
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
  yq e ".${key} = \"${value}\"" -i "$file" || {
    log "ERROR: Failed to update $key in $file using yq."
    # Attempt to restore from backup if yq created one (though -i usually doesn't)
    # Or handle the error more robustly depending on yq version/behavior
    exit 1
  }
}

# Determine the tag suffix based on the stage
# Always add the stage as a suffix now
TAG_SUFFIX="-$STAGE"
log "Tag suffix set to: $TAG_SUFFIX"

# Find package.json files to use as reference
MAIN_PACKAGE_JSON="${REPO_PATH}/plugins/main/package.json"
if [ ! -f "$MAIN_PACKAGE_JSON" ]; then
  log "ERROR: Main package.json not found at $MAIN_PACKAGE_JSON"
  exit 1
fi

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
  full_yml_path="${REPO_PATH}/${yml_file}"
  log "Processing $full_yml_path"
  update_yaml "$full_yml_path" "version" "$VERSION"
done

# --- Update CHANGELOG.md Start ---
log "Updating CHANGELOG.md..."
CHANGELOG_FILE="${REPO_PATH}/CHANGELOG.md"
PACKAGE_JSON_FILE="${REPO_PATH}/plugins/main/package.json"

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

# # --- Git Operations Start ---
# log "Checking for changes to commit..."
# if git diff --exit-code --quiet; then
#   log "No changes detected after bumping. Nothing to commit."
#   CHANGES_COMMITTED=false
# else
#   log "Changes detected. Committing..."
#   git diff --name-only # Log modified files
#   COMMIT_MSG="Bump v${VERSION}${TAG_SUFFIX}"
#   git commit -S -am "$COMMIT_MSG" || {
#     log "ERROR: Failed to commit changes."
#     exit 1
#   }
#   log "Commit successful: $COMMIT_MSG"
#   CHANGES_COMMITTED=true
# fi

# log "Creating tag: $TAG_NAME"
# TAG_MSG="Wazuh plugins for Wazuh dashboard ${TAG_NAME}"
# # Create a signed and annotated tag
# git tag -s -m "$TAG_MSG" "$TAG_NAME" || {
#   log "ERROR: Failed to create tag $TAG_NAME."
#   exit 1
# }
# log "Tag created successfully: $TAG_NAME"

# log "Pushing tag $TAG_NAME to remote origin"
# git push origin "$TAG_NAME" || {
#   log "ERROR: Failed to push tag $TAG_NAME."
#   exit 1
# }
# log "Tag pushed successfully."

# log "Resetting branch $TARGET_BRANCH to remote state (origin/$TARGET_BRANCH)"
# git reset --hard "origin/$TARGET_BRANCH" || {
#   log "ERROR: Failed to reset branch $TARGET_BRANCH."
#   exit 1
# }
# log "Branch reset successfully."

# if [ "$CHANGES_COMMITTED" = true ]; then
#   log "WARNING: A commit was added to the tag, but the local branch $TARGET_BRANCH was reset to the state of the remote."
# fi
# # --- Git Operations End ---

# log "Repository bump completed successfully"
# exit 0
