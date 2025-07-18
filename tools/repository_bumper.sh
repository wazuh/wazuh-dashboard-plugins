#!/bin/bash
#
# Wazuh Dashboard Plugins repository bumper (Pure Shell Version)
# This script automates version and stage bumping across the repository using only shell commands.
# Compatible with macOS and Linux systems.

set -e

# --- Global Variables ---
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_PATH=$(git rev-parse --show-toplevel 2>/dev/null)
# Use a more compatible timestamp format (nanoseconds may not be available on all systems)
DATE_TIME=$(date "+%Y-%m-%d_%H-%M-%S" 2>/dev/null || date "+%Y-%m-%d_%H-%M-%S")
LOG_FILE="${SCRIPT_PATH}/repository_bumper_${DATE_TIME}.log"
VERSION_FILE="${REPO_PATH}/VERSION.json"
VERSION=""
STAGE=""
REVISION="00"
TAG=false
CURRENT_VERSION=""
CURRENT_MAJOR_MINOR=""
NEW_MAJOR_MINOR=""
COMBINED_VERSION_REVISION=""
OPENSEARCH_VERSION=""

# Create log file
touch "$LOG_FILE"

# --- Helper Functions ---

# Function to run sed -i in a cross-platform way
sed_inplace() {
  # macOS requires an empty string after -i, Linux doesn't
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

# Function to run sed with extended regex in a cross-platform way
sed_extended() {
  # macOS uses -E, some Linux systems use -r
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -E "$@"
  else
    # Try -E first, fall back to -r if it fails
    sed -E "$@" 2>/dev/null || sed -r "$@"
  fi
}

# Function to log messages
log() {
  local message="$1"
  local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  echo "[${timestamp}] ${message}" | tee -a "$LOG_FILE"
}

# Function to show usage
usage() {
  echo "Usage: $0 [--version VERSION --stage STAGE | --tag] [--help]"
  echo ""
  echo "Parameters:"
  echo "  --version VERSION   Specify the version (e.g., 4.6.0)"
  echo "                      Required if --tag is not used"
  echo "  --stage STAGE       Specify the stage (e.g., alpha0, beta1, rc2, etc.)"
  echo "                      Required if --tag is not used"
  echo "  --tag               Generate a tag"
  echo "                      If --stage is not set, it will be stageless(e.g., v4.6.0)"
  echo "                      Otherwise it will be with the provided stage (e.g., v4.6.0-alpha1)"
  echo "                      If this is set, --version and --stage are not required."
  echo "  --help              Display this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --version 4.6.0 --stage alpha0"
  echo "  $0 --tag --stage alpha1"
  echo "  $0 --tag"
}

# Function to update JSON file using sed
update_json() {
  local file="$1"
  local key="$2"
  local value="$3"

  # Get the current value of the key at the top level (line 3 for version in package.json)
  local current_value
  if [ "$key" = "version" ] && [[ "$file" == *"package.json" ]]; then
    # For package.json, specifically get the version from line 3 to avoid nested version in pluginPlatform
    current_value=$(sed -n '3p' "$file" | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
  else
    current_value=$(grep -o "^[[:space:]]*\"$key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" "$file" | sed "s/.*\"$key\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/")
  fi

  if [ "$current_value" = "$value" ]; then
    # If the value is already correct, do nothing and don't report
    return
  fi

  log "Updating $key to $value in $file using sed"

  # Read the file, apply the filter, and write to a temporary file, then replace the original.
  # WARNING: Using sed for JSON manipulation is fragile and not recommended.
  log "Attempting to update $key to $value in $file using sed (Note: This is fragile)"

  # Escape key and value for use in sed regex and replacement string
  # Basic escaping for common sed special characters: &, /, \
  local escaped_key=$(printf '%s\n' "$key" | sed -e 's/[&/\]/\\&/g')
  local escaped_value=$(printf '%s\n' "$value" | sed -e 's/[&/\]/\\&/g')

  # For package.json version updates, be more specific to avoid updating nested versions
  if [ "$key" = "version" ] && [[ "$file" == *"package.json" ]]; then
    # Update only the first occurrence of version (which should be the top-level one)
    sed "1,/^[[:space:]]*\"version\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/{s/^\\([[:space:]]*\\)\"version\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\\1\"version\": \"$escaped_value\"/;}" "$file" >"${file}.tmp"
  else
    # Use the general approach for other keys
    sed "s/^\\([[:space:]]*\\)\"$escaped_key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\\1\"$escaped_key\": \"$escaped_value\"/g" "$file" >"${file}.tmp"
  fi

  # Check if sed actually made a change (simple check: compare files)
  if cmp -s "$file" "${file}.tmp"; then
    rm -f "${file}.tmp"
    return
  else
    # If files differ, move the temp file to the original file name
    mv "${file}.tmp" "$file" && log "Successfully updated $key in $file using sed" || {
      log "ERROR: Failed to move temporary file after updating $key in $file using sed."
      rm -f "${file}.tmp" # Clean up temp file on error
      exit 1
    }
  fi
}

# Function to update documentation URLs in endpoints.json
update_endpoints_json() {
  local old_doc_version="$1"
  local new_doc_version="$2"
  local endpoints_file="${REPO_PATH}/plugins/main/common/api-info/endpoints.json"

  # If the versions are the same, no update is needed.
  if [ "$old_doc_version" = "$new_doc_version" ]; then
    log "Documentation version ($old_doc_version) hasn't changed. Skipping endpoints.json update."
    return
  fi

  if [ ! -f "$endpoints_file" ]; then
    log "WARNING: $endpoints_file not found. Skipping documentation URL update."
    return
  fi

  log "Updating documentation URLs in $endpoints_file from $old_doc_version to $new_doc_version"

  # Use sed to replace the version string within the documentation URLs
  # Escape dots in the version strings for sed
  local escaped_old_version=$(echo "$old_doc_version" | sed 's/\./\\./g')
  local escaped_new_version=$(echo "$new_doc_version" | sed 's/\./\\./g')

  sed_inplace "s|documentation.wazuh.com/${escaped_old_version}|documentation.wazuh.com/${escaped_new_version}|g" "$endpoints_file" && log "Successfully updated documentation URLs in $endpoints_file" || {
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

  local replacement
  if [ "$TAG" = true ]; then
    replacement="v${VERSION}"
    if [ -n "$STAGE" ]; then
      replacement+="-${STAGE}"
    fi
  else
    replacement="${VERSION}"
  fi

  # Extract current reference from URL
  local current_spec_ref
  current_spec_ref=$(grep -oE 'specFile: https://raw.githubusercontent.com/wazuh/wazuh/[^/]+/' "$imposter_config_file" | sed_extended 's|.*/wazuh/([^/]+)/.*|\1|' | head -n1)

  if [ "$current_spec_ref" = "$replacement" ]; then
    return
  fi

  log "Updating specFile URL in $imposter_config_file to version $new_version"

  # Use sed to replace the version string within the specFile URL
  # Create a more compatible sed command for macOS
  sed_inplace "s|specFile: https://raw.githubusercontent.com/wazuh/wazuh/[^/]*/|specFile: https://raw.githubusercontent.com/wazuh/wazuh/${replacement}/|" "$imposter_config_file" &&
    log "Successfully updated specFile URL in $imposter_config_file" || {
    log "ERROR: Failed to update specFile URL in $imposter_config_file using sed."
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
    --tag)
      TAG=true
      shift
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
  if [ -z "$VERSION" ] && [ "$TAG" != true ]; then
    log "ERROR: --version is required unless --tag is set"
    usage
    exit 1
  fi

  if [ -z "$STAGE" ] && [ "$TAG" != true ]; then
    log "ERROR: --stage is required unless --tag is set"
    usage
    exit 1
  fi

  if [ -n "$VERSION" ] && ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    log "ERROR: Version must be in the format x.y.z (e.g., 4.6.0)"
    exit 1
  fi

  if [ -n "$STAGE" ] && ! [[ $STAGE =~ ^[a-zA-Z]+[0-9]+$ ]]; then
    log "ERROR: Stage must be alphanumeric (e.g., alpha0, beta1, rc2)"
    exit 1
  fi
}

# Function to perform pre-update checks and gather initial data
pre_update_checks() {
  if [ ! -f "$VERSION_FILE" ]; then
    log "ERROR: Root VERSION.json not found at $VERSION_FILE"
    exit 1
  fi

  # Attempt to extract version from VERSION.json using sed
  log "Attempting to extract current version from $VERSION_FILE using sed..."
  CURRENT_VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$VERSION_FILE" | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

  # Check if sed successfully extracted a version
  if [ -z "$CURRENT_VERSION" ]; then
    log "ERROR: Failed to extract 'version' from $VERSION_FILE using sed. Check file format or key presence."
    exit 1 # Exit if sed fails
  fi
  log "Successfully extracted version using sed: $CURRENT_VERSION"

  if [ "$CURRENT_VERSION" == "null" ]; then # Check specifically for "null" string if sed might output that
    log "ERROR: Could not read current version from $VERSION_FILE (value was 'null')"
    exit 1
  fi
  log "Current version detected in VERSION.json: $CURRENT_VERSION"

  CURRENT_MAJOR_MINOR=$(echo "$CURRENT_VERSION" | cut -d. -f1,2)
  if [ -z "$VERSION" ]; then # Check specifically for "null" string if sed might output that
    NEW_MAJOR_MINOR=$CURRENT_MAJOR_MINOR
  else
    NEW_MAJOR_MINOR=$(echo "$VERSION" | cut -d. -f1,2)
  fi

  log "Current major.minor: $CURRENT_MAJOR_MINOR"
  log "New major.minor: $NEW_MAJOR_MINOR"
  log "Default revision set to: $REVISION" # Log default revision here

  # Attempt to extract stage from VERSION.json using sed
  log "Attempting to extract current stage from $VERSION_FILE using sed..."
  CURRENT_STAGE=$(grep -o '"stage"[[:space:]]*:[[:space:]]*"[^"]*"' "$VERSION_FILE" | sed 's/.*"stage"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')

  # Check if sed successfully extracted a stage
  if [ -z "$CURRENT_STAGE" ]; then
    log "ERROR: Failed to extract 'stage' from $VERSION_FILE using sed. Check file format or key presence."
    exit 1 # Exit if sed fails
  fi
  log "Successfully extracted stage using sed: $CURRENT_STAGE"

  if [ "$CURRENT_STAGE" == "null" ]; then # Check specifically for "null" string if sed might output that
    log "ERROR: Could not read current stage from $VERSION_FILE (value was 'null')"
    exit 1
  fi
  log "Current stage detected in VERSION.json: $CURRENT_STAGE"
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
        log "New version ($VERSION) is identical to current version ($CURRENT_VERSION)"
        local main_package_json="${REPO_PATH}/plugins/main/package.json" # Need path again
        log "Attempting to extract current revision from $main_package_json using sed (Note: This is fragile)"
        local current_revision_val=$(grep -o '"revision"[[:space:]]*:[[:space:]]*"[^"]*"' "$main_package_json" | sed 's/.*"revision"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
        # Check if sed successfully extracted a revision
        if [ -z "$current_revision_val" ]; then
          log "ERROR: Failed to extract 'revision' from $main_package_json using sed. Check file format or key presence."
          exit 1 # Exit if sed fails
        fi
        log "Successfully extracted revision using sed: $current_revision_val"
        if [ -z "$current_revision_val" ] || [ "$current_revision_val" == "null" ]; then
          log "ERROR: Could not read current revision from $main_package_json"
          exit 1
        fi
        # Ensure CURRENT_REVISION is treated as a number (remove leading zeros for arithmetic if necessary, handle base 10)
        local current_revision_int=$((10#$current_revision_val))
        local new_revision_int=$((current_revision_int + 1))
        if [ -n "$STAGE" ] && [ "$STAGE" != "$CURRENT_STAGE" ]; then
          # Format back to two digits with leading zero
          log "Incrementing revision."
          REVISION=$(printf "%02d" "$new_revision_int")
          log "Current revision: $current_revision_val. New revision set to: $REVISION"
        else
          REVISION=$(printf "%02d" "$current_revision_int")
          log "Current revision: $current_revision_val."
        fi
      fi
    fi
  fi
  log "Final revision determined: $REVISION"
}

# Function to update VERSION.json
update_root_version_json() {
  if [ -f "$VERSION_FILE" ]; then
    log "Processing $VERSION_FILE"
    if [ -n "$VERSION" ]; then
      update_json "$VERSION_FILE" "version" "$VERSION"
    fi
    if [ -n "$STAGE" ]; then
      update_json "$VERSION_FILE" "stage" "$STAGE"
    fi
  else
    log "WARNING: $VERSION_FILE not found. Skipping update."
  fi
}

# Function to update package.json files
update_package_json_files() {
  local plugins_dir="${REPO_PATH}/plugins"
  log "Updating package.json files..."
  # Use git ls-files to find tracked package.json files within the plugins directory, excluding test/cypress/package.json
  git ls-files "$plugins_dir" | grep '/package.json$' | grep -v 'test/cypress/package.json' | while IFS= read -r pkg_file; do
    local full_pkg_path
    full_pkg_path=$(realpath "${pkg_file}")
    update_json "$full_pkg_path" "version" "$VERSION"
    update_json "$full_pkg_path" "revision" "$REVISION"
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
  # Attempt to extract OpenSearch Dashboards version using sed (WARNING: Fragile!)
  # This assumes "pluginPlatform": { ... "version": "x.y.z" ... } structure
  # It looks for the block starting with "pluginPlatform": { and ending with }
  # Within that block, it finds the line starting with "version": "..." and extracts the value.
  # This is significantly less reliable than using jq.
  log "Attempting to extract pluginPlatform.version from $package_json_file using sed (Note: This is fragile)"
  # Use a more targeted approach - look for the pluginPlatform block and extract version from it
  OPENSEARCH_VERSION=$(grep -A 5 '"pluginPlatform"' "$package_json_file" | grep '"version"' | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
  if [ -z "$OPENSEARCH_VERSION" ] || [ "$OPENSEARCH_VERSION" == "null" ]; then
    log "ERROR: Could not extract pluginPlatform.version from $package_json_file for changelog"
    exit 1
  fi
  log "Detected OpenSearch Dashboards version for changelog: $OPENSEARCH_VERSION"

  # Construct the new changelog entry
  # Note: Using printf for better handling of newlines and potential special characters
  # Use the calculated REVISION variable here
  # Prepare the header to search for
  local changelog_header="## Wazuh v${VERSION} - OpenSearch Dashboards ${OPENSEARCH_VERSION} - Revision "
  local changelog_header_regex="^## Wazuh v${VERSION} - OpenSearch Dashboards ${OPENSEARCH_VERSION} - Revision [0-9]+"

  # Check if an entry for this version and OpenSearch version already exists
  if grep -qE "$changelog_header_regex" "$changelog_file"; then
    if [ -n "$STAGE" ]; then
      log "Changelog entry for this version and OpenSearch Dashboards version exists. Updating revision only."
      # Use sed to update only the revision number in the header
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' -E "s|(${changelog_header_regex})|## Wazuh v${VERSION} - OpenSearch Dashboards ${OPENSEARCH_VERSION} - Revision ${REVISION}|" "$changelog_file"
      else
        # Try -E first, fall back to -r if it fails
        sed -i -E "s|(${changelog_header_regex})|## Wazuh v${VERSION} - OpenSearch Dashboards ${OPENSEARCH_VERSION} - Revision ${REVISION}|" "$changelog_file" 2>/dev/null ||
          sed -i -r "s|(${changelog_header_regex})|## Wazuh v${VERSION} - OpenSearch Dashboards ${OPENSEARCH_VERSION} - Revision ${REVISION}|" "$changelog_file"
      fi &&
        log "CHANGELOG.md revision updated successfully." || {
        log "ERROR: Failed to update revision in $changelog_file"
        exit 1
      }
    fi
  else
    log "No existing changelog entry for this version and OpenSearch Dashboards version. Inserting new entry."

    # Create the new entry directly in the changelog using sed
    local temp_file=$(mktemp)
    head -n 4 "$changelog_file" >"$temp_file"
    printf "\n## Wazuh v%s - OpenSearch Dashboards %s - Revision %s\n\n### Added\n\n- Support for Wazuh %s\n\n" "$VERSION" "$OPENSEARCH_VERSION" "$REVISION" "$VERSION" >>"$temp_file"
    tail -n +5 "$changelog_file" >>"$temp_file"

    mv "$temp_file" "$changelog_file" || {
      log "ERROR: Failed to update $changelog_file"
      rm -f "$temp_file" # Clean up temp file on error
      exit 1
    }
    log "CHANGELOG.md updated successfully."
  fi
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
  validate_input
  log "Version: $VERSION"
  log "Stage: $STAGE"

  # Perform pre-update checks
  pre_update_checks
  if [ -z "$VERSION" ]; then
    VERSION=$CURRENT_VERSION # If no version provided, use current version
  fi

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
  update_osd_json_files
  update_changelog

  # Conditionally update endpoints.json
  if [[ -n "$VERSION" && "$CURRENT_MAJOR_MINOR" != "$NEW_MAJOR_MINOR" ]]; then
    log "Major.minor version changed ($CURRENT_MAJOR_MINOR -> $NEW_MAJOR_MINOR). Updating endpoints.json..."
    update_endpoints_json "$CURRENT_MAJOR_MINOR" "$NEW_MAJOR_MINOR"
  else
    log "Major.minor version ($CURRENT_MAJOR_MINOR) remains the same. Skipping endpoints.json update."
  fi

  # Update docker/imposter/wazuh-config.yml
  log "Updating docker/imposter/wazuh-config.yml..."
  update_imposter_config "$VERSION"

  log "File modifications completed."
  log "WARNING: API spec data generation (if applicable) needs to be done manually or with other tools."
  log "Repository bump completed successfully. Log file: $LOG_FILE"
  exit 0
}

# Execute main function with all script arguments
main "$@"
