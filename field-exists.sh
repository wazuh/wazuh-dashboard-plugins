#!/bin/bash

# Colors for output
GRAY='\033[0;90m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
UNDERLINE='\033[4m'
NC='\033[0m' # No Color

logError() {
  echo -e "[ ${RED}ERROR${NC} ] $@" >&2
}

logWarn() {
  echo -e "[ ${YELLOW}WARN${NC} ] $@" >&2
}

usage() {
  echo -e "${BLUE}Usage:${NC} $(basename $0) <field>"
  echo -e "${BLUE}Example:${NC} $(basename $0) metadata.author.name"
  echo
  echo "This script checks if a specified field exists in JSON mapping files"
  echo "and displays its definition if found."
  echo
  echo -e "${BLUE}Requirements:${NC}"
  {
    echo "  - ripgrep (rg) | for searching files"
    echo "  - jq | for parsing JSON"
  } | column -t -s '|'
}

check_dependencies() {
  # Check if all required dependencies are installed
  local deps=("$@")

  for cmd in "${deps[@]}"; do
    if ! command -v "$cmd" &>/dev/null; then
      logError "Required tool '$cmd' is not installed or not in PATH." >&2
      logError "Please install '$cmd' to use this script." >&2
      exit 2
    fi
  done
}

has_mappings() {
  local file="$1"
  if [[ -f "$file" ]]; then
    # Check if file has mappings.properties structure
    if jq -e '.mappings.properties' "$file" >/dev/null 2>&1; then
      return 0 # True, file has mappings
    fi
  fi
  return 1 # False, file doesn't have mappings
}

main() {
  check_dependencies rg jq

  local field="$1" # e.g., metadata.author.name

  if [[ -z "$field" ]]; then
    logError "Field parameter is required" >&2
    usage
    exit 1
  fi

  local last_field="${field##*.}"

  echo -e "${BLUE}Searching for field:${NC} ${UNDERLINE}$field${NC}\n"

  # This script will check if a field exists in a file
  local exclusions=(
    "plugins/main"
    "docker/imposter"
    "docker/wazuh-4*"
    "tsconfig*"
    "VERSION*"
  )

  local file_search_exclusions=""
  for exclusion in "${exclusions[@]}"; do
    file_search_exclusions+=" -E '$exclusion'"
  done

  # Execute the command to find files
  local files="$(fd -e json --type f . $file_search_exclusions)"

  if [[ -z "$files" ]]; then
    echo -e "${YELLOW}No files found containing the field '${last_field}'.${NC}"
    exit 0
  fi

  local mapped_field="${field//\./.properties.}"
  local found=false

  while IFS= read -r file; do
    field_object="$(cat "$file" | jq ".mappings.properties.$mapped_field" 2>/dev/null)"
    if has_mappings "$file"; then
      echo -e "${BLUE}Checking:${NC} ${MAGENTA}$file${NC}"
      if [[ -n $field_object && $field_object != "null" ]]; then
        found=true
        echo
        echo "{ \"$field\": $field_object }" | jq 2>/dev/null
      else
        echo
        logWarn "Field '${UNDERLINE}$field${NC}' not found in this file."
      fi
      echo
      echo -e "${GRAY}$(printf '=%.0s' {1..80})${NC}"
    fi
  done <<<"$files"

  if [[ "$found" == "false" ]]; then
    echo
    logWarn "Field '${UNDERLINE}$field${NC}' was not found in any mapping properties."
  fi
}

if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  usage
  exit 0
fi

main "$@"
