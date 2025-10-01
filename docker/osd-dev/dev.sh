#!/bin/bash

usage() {
  echo
  echo "./dev.sh [-o os_version] [-d osd_version] [-a agents_up] [-r repo=absolute_path ...] [-base [dashboard_repo]] [default_repo_root] action [saml|server|server-local] [server_version]"
  echo
  echo "where"
  echo "  -o os_version Specify the OS version (optional)"
  echo "  -d osd_version Specify the OSD version (optional)"
  echo "  -a agents_up Specify 'rpm' or 'deb' to deploy an agent with server-local, or 'without' to deploy no agent (optional) (default: deploy 2 agents)"
  echo "  -r repo=absolute_path Mount an external plugin repository (repeatable)."
  echo "     Use -r only for external repos, e.g.: wazuh-dashboard-reporting/abs/path/wazuh-dashboard-reporting"
  echo "  -base [dashboard_repo] Use a base OS image for osd and mount a local wazuh-dashboard repository at /home/node/kbn (optional path)"
  echo "  default_repo_root Optional absolute path used as the base location for repositories"
  echo "  action is one of up | down | stop | start | manager-local-up"
  echo "  saml to deploy a saml enabled environment (optional)"
  echo "  server to deploy a real server enabled environment (optional, requires server_version)"
  echo "  server-local to deploy a real server enabled environment (optional, requires server_version)"
  exit -1
}

exit_with_message() {
  echo "[ERROR] $1"
  exit -1
}

DEFAULT_SRC=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Accumulator of user provided repo overrides (one per line: name%/abs/path)
USER_REPOS=""

to_env_var_name() {
  local sanitized="${1//-/_}"
  sanitized="${sanitized//./_}"
  local upper
  upper=$(printf '%s' "$sanitized" | tr '[:lower:]' '[:upper:]')
  echo "REPO_${upper}"
}

resolve_default_repo_path() {
  local repo="$1"
  local base="$DEFAULT_SRC"

  if [[ -z "$base" ]]; then
    echo ""
    return
  fi

  local trimmed="${base%/}"

  if [[ -d "${trimmed}/plugins/${repo}" ]]; then
    echo "${trimmed}/plugins/${repo}"
    return
  fi

  if [[ -d "${trimmed}/${repo}" ]]; then
    echo "${trimmed}/${repo}"
    return
  fi

  if [[ -d "${trimmed}" && "$(basename "$trimmed")" == "$repo" ]]; then
    echo "${trimmed}"
    return
  fi

  echo ""
}

resolve_repo_path() {
  local repo="$1"; local path=""; local line name value
  # Search user overrides first
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    name="${line%%%*}"; value="${line#*%}"
    if [[ "$name" == "$repo" ]]; then
      path="$value"; break
    fi
  done <<< "$USER_REPOS"
  if [[ -z "$path" ]]; then
    path="$(resolve_default_repo_path "$repo")"
  fi
  if [[ -z "$path" ]]; then
    exit_with_message "Repository path for '$repo' not provided. Supply a default repository root or use -r ${repo}=/absolute/path."
  fi
  if [[ "$path" != /* ]]; then
    exit_with_message "Repository path '$path' for '$repo' must be absolute."
  fi
  if [[ ! -d "$path" ]]; then
    exit_with_message "Repository path '$path' for '$repo' does not exist."
  fi
  if [[ "$path" != "/" ]]; then
    path="${path%/}"
  fi
  echo "$path"
}

is_reserved_token() {
  case "$1" in
  up | down | start | stop | manager-local-up | saml | server | server-local | server-local-rpm | server-local-deb | server-local-without)
    return 0
    ;;
  esac
  return 1
}

resolve_absolute_path() {
  local input="$1"
  if [[ -z "$input" ]]; then
    echo ""
    return 0
  fi
  local resolved
  if ! resolved=$(realpath "$input" 2>/dev/null); then
    return 1
  fi
  if [[ "$resolved" != "/" ]]; then
    resolved="${resolved%/}"
  fi
  echo "$resolved"
}

infer_base_dashboard_path() {
  local candidate
  if [[ -n "$DEFAULT_SRC" ]]; then
    candidate="$(resolve_absolute_path "$(dirname "$DEFAULT_SRC")/wazuh-dashboard")"
    if [[ -n "$candidate" && -d "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  fi

  candidate="$(resolve_absolute_path "${SCRIPT_DIR}/../../../wazuh-dashboard")"
  if [[ -n "$candidate" && -d "$candidate" ]]; then
    echo "$candidate"
    return 0
  fi

  echo ""
  return 1
}

if ! command -v jq &>/dev/null; then
  echo "[ERROR] jq is not installed. Please install jq to continue."
  echo "sudo apt-get install jq in Debian/Ubuntu OS"
  echo "sudo yum install jq in RedHat/CentOS OS"
  echo "sudo pacman -Sy --noconfirm jq in Arch OS"
  echo "brew install jq in MAC OS"
  exit 1
fi

PACKAGE_PATH="../../plugins/wazuh-core/package.json"
os_version=""
osd_version=""
agents_up=""
BASE_MODE=false
BASE_REPO_ARG=""
BASE_DASHBOARD_PATH=""
BASE_VOLUME_NAME="wazuh-dashboard-base"
BASE_OSD_IMAGE_FALLBACK="node:20-bookworm-slim"
BASE_NODE_VERSION=""
POSITIONAL=()

while [[ $# -gt 0 ]]; do
  case "$1" in
  -o)
    if [[ -z "${2:-}" ]]; then
      exit_with_message "The -o option requires an argument."
    fi
    os_version=$2
    shift 2
    ;;
  -d)
    if [[ -z "${2:-}" ]]; then
      exit_with_message "The -d option requires an argument."
    fi
    osd_version=$2
    shift 2
    ;;
  -a)
    if [[ -z "${2:-}" ]]; then
      exit_with_message "The -a option requires an argument."
    fi
    agents_up=$2
    shift 2
    ;;
  -r)
    if [[ -z "${2:-}" ]]; then
      exit_with_message "The -r option requires an argument."
    fi
    repo_spec=$2
    if [[ "$repo_spec" != *=* ]]; then
      exit_with_message "Invalid repository specification '${repo_spec}'. Expected format repo=/absolute/path."
    fi
    repo_name=${repo_spec%%=*}
    repo_path=${repo_spec#*=}
    if [[ -z "$repo_name" || -z "$repo_path" ]]; then
      exit_with_message "Invalid repository specification '${repo_spec}'. Expected format repo=/absolute/path."
    fi
    if [[ "$repo_path" != "/" ]]; then
      repo_path="${repo_path%/}"
    fi
    USER_REPOS+="${repo_name}%${repo_path}"$'\n'
    shift 2
    ;;
  -base)
    BASE_MODE=true
    # ${2:-} may be empty or another option
    # ${2:0:1} is first character of ${2:-}, if any
    if [[ -n "${2:-}" && "${2:0:1}" != "-" ]]; then
      if ! is_reserved_token "$2"; then
        BASE_REPO_ARG=$2
        shift
      fi
    fi
    shift
    ;;
  -base=*)
    BASE_MODE=true
    # ${1#*=} is the value of the -base option
    BASE_REPO_ARG="${1#*=}"
    shift
    ;;
  --)
    shift
    while [[ $# -gt 0 ]]; do
      POSITIONAL+=("$1")
      shift
    done
    ;;
  -*)
    exit_with_message "Invalid option: $1"
    ;;
  *)
    POSITIONAL+=("$1")
    shift
    ;;
  esac
done

set -- "${POSITIONAL[@]}"

if [[ -n "$agents_up" && "$agents_up" != "rpm" && "$agents_up" != "deb" && "$agents_up" != "without" ]]; then
  echo "[ERROR] Invalid value for -a option. Allowed values are 'rpm', 'deb' 'without', or an empty string." >&2
  usage
  exit 1
fi

if [ -z "$os_version" ] || [ -z "$osd_version" ]; then
  if [ ! -f $PACKAGE_PATH ]; then
    echo "[ERROR] The file package.json was not found."
    exit 1
  fi

  if [ -z "$os_version" ]; then
    echo "[INFO] OS Version not received via flag, getting the version from $PACKAGE_PATH"
    os_version=$(jq -r '.pluginPlatform.version' $PACKAGE_PATH)
    if [ -z "$os_version" ]; then
      echo "[ERROR] Could not retrieve the OS version from package.json."
      exit 1
    fi
  fi

  if [ -z "$osd_version" ]; then
    echo "[INFO] OSD Version not received via flag, getting the version from $PACKAGE_PATH"
    osd_version=$(jq -r '.pluginPlatform.version' $PACKAGE_PATH)
    if [ -z "$osd_version" ]; then
      echo "[ERROR] Could not retrieve the OSD version from package.json."
      exit 1
    fi
  fi
fi

if [ $# -lt 1 ]; then
  echo "[ERROR] Incorrect number of arguments $#, got $@"
  echo
  usage
fi

if [[ $1 == /* ]]; then
  DEFAULT_SRC=${1%/}
  shift
  if [[ ! -d "$DEFAULT_SRC" ]]; then
    exit_with_message "Source path '$DEFAULT_SRC' does not exist."
  fi
fi

# If user did not supply a DEFAULT_SRC, infer repository root (two levels up) so that
# internal plugins under ./plugins/<name> are auto-detected without requiring -r.
if [[ -z "$DEFAULT_SRC" ]]; then
  inferred_root="$(realpath "${SCRIPT_DIR}/../.." 2>/dev/null)"
  if [[ -d "${inferred_root}/plugins" ]]; then
    DEFAULT_SRC="${inferred_root}"
  fi
fi

if [[ "$BASE_MODE" == true ]]; then
  if [[ -n "$BASE_REPO_ARG" ]]; then
    if ! base_candidate=$(resolve_absolute_path "$BASE_REPO_ARG"); then
      exit_with_message "Repository path '$BASE_REPO_ARG' for 'wazuh-dashboard' must exist."
    fi
  else
    base_candidate=$(infer_base_dashboard_path)
  fi

  if [[ -z "$base_candidate" ]]; then
    exit_with_message "Base dashboard repository path not provided. Supply -base /absolute/path or place 'wazuh-dashboard' next to the plugins repository."
  fi

  if [[ ! -d "$base_candidate" ]]; then
    exit_with_message "Repository path '$base_candidate' for 'wazuh-dashboard' does not exist."
  fi

  if [[ "$base_candidate" == "/" ]]; then
    exit_with_message "Repository path for 'wazuh-dashboard' cannot be the root directory ('/')."
  fi

  BASE_DASHBOARD_PATH="$base_candidate"

  if [[ -z "${SRC_SECURITY_PLUGIN:-}" ]]; then
    possible_security_paths=(
      "$(dirname "$BASE_DASHBOARD_PATH")/wazuh-security-dashboards-plugin"
      "${BASE_DASHBOARD_PATH}/plugins/wazuh-security-dashboards"
      "${SCRIPT_DIR}/../../../wazuh-security-dashboards-plugin"
    )

    for candidate in "${possible_security_paths[@]}"; do
      trimmed="${candidate%/}"
      if [[ -d "$trimmed" ]]; then
        if resolved=$(realpath "$trimmed" 2>/dev/null); then
          export SRC_SECURITY_PLUGIN="${resolved%/}"
        else
          export SRC_SECURITY_PLUGIN="$trimmed"
        fi
        break
      fi
    done

    if [[ -z "${SRC_SECURITY_PLUGIN:-}" ]]; then
      if ! command -v mktemp &>/dev/null; then
        exit_with_message "Security plugin repository not found and mktemp is unavailable to provision a placeholder directory."
      fi
      placeholder_dir=$(mktemp -d "${TMPDIR:-/tmp}/wazuh-security-plugin.XXXXXX")
      if [[ -z "$placeholder_dir" || ! -d "$placeholder_dir" ]]; then
        exit_with_message "Unable to provision placeholder directory for security plugin."
      fi
      export SRC_SECURITY_PLUGIN="$placeholder_dir"
      echo "[WARN] Security plugin repository not found. Using temporary placeholder '${placeholder_dir}'."
    fi
  fi

  if [[ -z "${BASE_OSD_IMAGE:-}" ]]; then
    nvm_file="${BASE_DASHBOARD_PATH}/.nvmrc"
    if [[ -f "$nvm_file" ]]; then
      raw_version=$(head -n 1 "$nvm_file" | tr -d '\r' | sed 's/#.*$//' | tr -d '[:space:]')
      if [[ -n "$raw_version" ]]; then
        stripped="$raw_version"
        if [[ "$stripped" == v* ]]; then
          stripped=${stripped#v}
        fi
        if [[ "$stripped" =~ ^[0-9]+(\.[0-9]+){0,2}$ ]]; then
          BASE_NODE_VERSION="$stripped"
        else
          echo "[WARN] Unsupported .nvmrc value '$raw_version'. Using default base image '${BASE_OSD_IMAGE_FALLBACK}'."
        fi
      else
        echo "[WARN] Empty .nvmrc file at ${nvm_file}. Using default base image '${BASE_OSD_IMAGE_FALLBACK}'."
      fi
    else
      echo "[WARN] .nvmrc not found at ${nvm_file}. Using default base image '${BASE_OSD_IMAGE_FALLBACK}'."
    fi
  fi
fi

if [ $# -lt 1 ]; then
  echo "[ERROR] Missing action argument"
  echo
  usage
fi

action=$1
shift

mode=""
mode_version=""

if [ $# -ge 1 ]; then
  mode=$1
  shift
fi

if [ $# -ge 1 ]; then
  mode_version=$1
  shift
fi

if [[ "$BASE_MODE" == true ]]; then
  if [[ -n "$mode" && "$mode" != "dashboard-src" ]]; then
    exit_with_message "The -base flag is only compatible with the 'dashboard-src' mode."
  fi
  mode="dashboard-src"
  export SRC_DASHBOARD="$BASE_DASHBOARD_PATH"
fi

if [ $# -ge 1 ]; then
  echo "[ERROR] Unexpected arguments: $*"
  echo
  usage
  exit 1
fi

required_repos=("main" "wazuh-core" "wazuh-check-updates")
external_dynamic_repos=()
all_repos=()

# Resolve required first
for repo in "${required_repos[@]}"; do
  path="$(resolve_repo_path "$repo")"
  var_name=$(to_env_var_name "$repo")
  export "$var_name"="$path"
  all_repos+=("$repo")
done

# Iterate provided overrides, add those not in required set as external
while IFS= read -r line; do
  [ -z "$line" ] && continue
  name="${line%%%*}"; value="${line#*%}"
  skip=false
  for req in "${required_repos[@]}"; do
    if [[ "$name" == "$req" ]]; then
      # It's an override of an internal repo: re-export explicit path
      var_name=$(to_env_var_name "$name")
      export "$var_name"="$value"
      skip=true
      break
    fi
  done
  if [[ "$skip" == false ]]; then
    var_name=$(to_env_var_name "$name")
    export "$var_name"="$value"
    external_dynamic_repos+=("$name")
    all_repos+=("$name")
  fi
done <<< "$USER_REPOS"

override_file="dev.override.generated.yml"
service_volume_entries=()
volume_definitions=()
override_sources=()

override_service="osd"
if [[ "$mode" == "dashboard-src" ]]; then
  override_service="dashboard-src"
fi

if [[ "$BASE_MODE" == true && "$override_service" == "osd" ]]; then
  service_volume_entries+=("      - '${BASE_VOLUME_NAME}:/home/node/kbn'")
  volume_definitions+=("  ${BASE_VOLUME_NAME}:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ${BASE_DASHBOARD_PATH}")
  override_sources+=("wazuh-dashboard")
fi

if [[ ${#external_dynamic_repos[@]} -gt 0 ]]; then
  override_sources+=("${external_dynamic_repos[@]}")
  for repo in "${external_dynamic_repos[@]}"; do
    service_volume_entries+=("      - '${repo}:/home/node/kbn/plugins/${repo}'")
    var_name=$(to_env_var_name "$repo")
    repo_path=${!var_name}
    repo_path=${repo_path%$'\n'}
    if [[ -z "$repo_path" ]]; then
      exit_with_message "Repository path for '$repo' not resolved."
    fi
    volume_definitions+=("  ${repo}:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ${repo_path}")
  done
fi

if [[ ${#service_volume_entries[@]} -gt 0 ]]; then
  {
    echo "services:"
    echo "  ${override_service}:"
    if [[ "$BASE_MODE" == true && "$override_service" == "osd" ]]; then
      echo "    working_dir: /home/node/kbn"
    fi
    echo "    volumes:"
    for entry in "${service_volume_entries[@]}"; do
      echo "$entry"
    done
    if [[ ${#volume_definitions[@]} -gt 0 ]]; then
      echo "volumes:"
      for definition in "${volume_definitions[@]}"; do
        printf '%s\n' "$definition"
      done
    fi
  } > "${override_file}"

  if [[ ${#override_sources[@]} -gt 0 ]]; then
    echo "[INFO] Generating dynamic compose override for: ${override_sources[*]}"
  fi
else
  if [[ -f "${override_file}" ]]; then
    rm -f "${override_file}"
  fi
  echo "[INFO] No external repositories provided. Only internal plugins mounted."
fi

COMPOSE_FILES=( -f dev.yml )
if [[ -f "${override_file}" ]]; then
  COMPOSE_FILES+=( -f "${override_file}" )
fi

export PASSWORD=${PASSWORD:-admin}
export OS_VERSION=$os_version
export OSD_VERSION=$osd_version
export OSD_PORT=${PORT:-5601}
export IMPOSTER_VERSION=3.44.1
export SRC=$DEFAULT_SRC
export OSD_MAJOR_NUMBER=$(echo $OSD_VERSION | cut -d. -f1)
export COMPOSE_PROJECT_NAME=os-dev-${OSD_VERSION//./}
export WAZUH_STACK=""
export WAZUH_VERSION_DEVELOPMENT=$(jq -r '.version' $PACKAGE_PATH)
if [[ -z "${SRC_DASHBOARD:-}" ]]; then
  if SRC_DASHBOARD_PATH=$(realpath ../../../wazuh-dashboard 2>/dev/null); then
    export SRC_DASHBOARD="$SRC_DASHBOARD_PATH"
  else
    export SRC_DASHBOARD=""
  fi
fi
if [[ -z "${SRC_SECURITY_PLUGIN:-}" ]]; then
  if SRC_SECURITY_PLUGIN_PATH=$(realpath ../../../wazuh-security-dashboards-plugin 2>/dev/null); then
    export SRC_SECURITY_PLUGIN="$SRC_SECURITY_PLUGIN_PATH"
  else
    export SRC_SECURITY_PLUGIN=""
  fi
fi

if [[ "$BASE_MODE" == true ]]; then
  base_image="${BASE_OSD_IMAGE:-$BASE_OSD_IMAGE_FALLBACK}"
  if [[ -z "${BASE_OSD_IMAGE:-}" && -n "$BASE_NODE_VERSION" ]]; then
    node_image_suffix="${BASE_NODE_IMAGE_SUFFIX:-bookworm-slim}"
    if [[ -n "$node_image_suffix" ]]; then
      base_image="node:${BASE_NODE_VERSION}-${node_image_suffix}"
    else
      base_image="node:${BASE_NODE_VERSION}"
    fi
  fi
  export OSD_IMAGE="$base_image"
  echo "[INFO] Base mode enabled. Using node image '$base_image' with 'dashboard-src' profile and mounting '${BASE_DASHBOARD_PATH}'."
fi

if [[ "$OSD_MAJOR_NUMBER" -ge 2 ]]; then
  export OSD_MAJOR="2.x"
else
  export OSD_MAJOR="1.x"
fi

profile="standard"
export WAZUH_DASHBOARD_CONF=./config/${OSD_MAJOR}/osd/opensearch_dashboards.yml
export SEC_CONFIG_FILE=./config/${OSD_MAJOR}/os/config.yml

if [[ -n "$mode" ]]; then
  case "$mode" in
  saml)
    if ! grep -q "idp" /etc/hosts; then
      exit_with_message "Add idp to /etc/hosts"
    fi

    profile="saml"
    export WAZUH_DASHBOARD_CONF=./config/${OSD_MAJOR}/osd/opensearch_dashboards_saml.yml
    export SEC_CONFIG_FILE=./config/${OSD_MAJOR}/os/config-saml.yml
    ;;
  server)
    if [[ -z "$mode_version" ]]; then
      exit_with_message "server mode requires the server_version argument"
    fi
    profile="server"
    export WAZUH_STACK="${mode_version}"
    ;;
  dashboard-src)
    profile="dashboard-src"

    if [[ -z "$SRC_DASHBOARD" ]]; then
      echo 'Define the SRC_DASHBOARD env variable pointing to the root directory of the dashboard.';
      exit 1;
    fi

    if [[ ! -d "$SRC_DASHBOARD" ]]; then
      echo 'The SRC_DASHBOARD env variable is not poiting to a directory.';
      exit 1;
    fi

    if [[ -z "$SRC_SECURITY_PLUGIN" ]]; then
      echo 'Define the SRC_SECURITY_PLUGIN env variable pointing to the root directory of the security plugin.';
      exit 1;
    fi

    if [[ ! -d "$SRC_SECURITY_PLUGIN" ]]; then
      echo 'The SRC_SECURITY_PLUGIN env variable is not poiting to a directory.';
      exit 1;
    fi

    node_version_path="$SRC_DASHBOARD/.nvmrc"

    if [[ ! -f "$node_version_path" ]]; then
      echo ".nvmrc not found in $node_version_path. Did you define correctly the path to the dashboard?";
      exit 1;
    fi
    echo "Loading NODE_VERSION from $node_version_path."
    raw_node_version=$(head -n 1 "$node_version_path" | tr -d '\r' | sed 's/#.*$//' | tr -d '[:space:]')
    if [[ -z "$raw_node_version" ]]; then
      echo "The .nvmrc file at $node_version_path is empty."
      exit 1
    fi
    normalized_node_version="$raw_node_version"
    if [[ "$normalized_node_version" == v* ]]; then
      normalized_node_version=${normalized_node_version#v}
    fi
    export NODE_VERSION="$normalized_node_version"
    echo "NODE_VERSION env var set as: $NODE_VERSION."

    dashboard_src_base_image="node:${NODE_VERSION}"
    if [[ -n "${BASE_OSD_IMAGE:-}" ]]; then
      dashboard_src_base_image="${BASE_OSD_IMAGE}"
    else
      node_image_suffix="${BASE_NODE_IMAGE_SUFFIX:-bookworm-slim}"
      if [[ -n "$node_image_suffix" ]]; then
        dashboard_src_base_image="node:${NODE_VERSION}-${node_image_suffix}"
      fi
    fi
    export DASHBOARD_SRC_BASE_IMAGE="$dashboard_src_base_image"
    ;;
  server-local)
    if [[ -z "$mode_version" ]]; then
      exit_with_message "server-local mode requires the server_version argument"
    fi
    if [[ -n "$agents_up" ]]; then
      profile="server-local-${agents_up}"
    else
      profile="server-local"
    fi
    export IMAGE_TAG="${mode_version}"
    ;;
  server-local-rpm | server-local-deb | server-local-without)
    if [[ -z "$mode_version" ]]; then
      exit_with_message "${mode} mode requires the server_version argument"
    fi
    profile="$mode"
    export IMAGE_TAG="${mode_version}"
    ;;
  *)
    exit_with_message "Unsupported mode '$mode'"
    ;;
  esac
fi

export SEC_CONFIG_PATH=/usr/share/opensearch/plugins/opensearch-security/securityconfig
if [[ "$OSD_MAJOR" == "2.x" ]]; then
  export SEC_CONFIG_PATH=/usr/share/opensearch/config/opensearch-security
fi

case "$action" in
up)
  /bin/bash ../scripts/create_docker_networks.sh
  docker compose --profile "$profile" "${COMPOSE_FILES[@]}" up -Vd

  # Display a command to deploy an agent when using the real server
  if [[ "$mode" == "server" ]]; then
    echo
    echo "**************WARNING**************"
    echo "The agent version must be a published one. This uses only released versions."
    echo "If you need to change de version, edit the command as you see fit."
    echo "***********************************"
    echo "1. (Optional) Enroll an agent (Ubuntu 20.04):"
    echo "docker run --name ${COMPOSE_PROJECT_NAME}-agent-\$(date +%s) --network os-dev-${OS_VERSION} --label com.docker.compose.project=${COMPOSE_PROJECT_NAME} --env WAZUH_AGENT_VERSION=${WAZUH_STACK} -d ubuntu:20.04 bash -c '"
    echo "  apt update -y"
    echo "  apt install -y curl lsb-release"
    echo "  curl -so \wazuh-agent-\${WAZUH_AGENT_VERSION}.deb \\"
    echo "    https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_\${WAZUH_AGENT_VERSION}-1_amd64.deb \\"
    echo "    && WAZUH_MANAGER='wazuh.manager' WAZUH_AGENT_GROUP='default' dpkg -i ./wazuh-agent-\${WAZUH_AGENT_VERSION}.deb"
    echo
    echo "  /etc/init.d/wazuh-agent start"
    echo "  tail -f /var/ossec/logs/ossec.log"
    echo "'"
    echo
  fi
  ;;
start)
  docker compose --profile "$profile" "${COMPOSE_FILES[@]}" start
  ;;
down)
  docker compose --profile "$profile" "${COMPOSE_FILES[@]}" down -v --remove-orphans
  ;;
stop)
  docker compose --profile "$profile" "${COMPOSE_FILES[@]}" -p ${COMPOSE_PROJECT_NAME} stop
  ;;
manager-local-up)
  docker compose --profile "$profile" "${COMPOSE_FILES[@]}" -p ${COMPOSE_PROJECT_NAME} up -d wazuh.manager.local
  ;;
*)
  echo "[ERROR] Action must be up | down | stop | start | manager-local-up: "
  echo
  usage
  ;;
esac
