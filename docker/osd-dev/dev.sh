#!/bin/bash

usage() {
  echo
  echo "./dev.sh [-o os_version] [-d osd_version] [-a agents_up] [-r repo=absolute_path ...] [default_repo_root] action [saml|server|server-local] [server_version]"
  echo
  echo "where"
  echo "  -o os_version Specify the OS version (optional)"
  echo "  -d osd_version Specify the OSD version (optional)"
  echo "  -a agents_up Specify 'rpm' or 'deb' to deploy an agent with server-local, or 'without' to deploy no agent (optional) (default: deploy 2 agents)"
  echo "  -r repo=absolute_path Mount an external plugin repository (repeatable)."
  echo "     Use -r only for external repos, e.g.: wazuh-dashboard-reporting/abs/path/wazuh-dashboard-reporting"
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

  if [[ -d "${trimmed}/${repo}" ]]; then
    echo "${trimmed}/${repo}"
    return
  fi

  if [[ -d "${trimmed}/plugins/${repo}" ]]; then
    echo "${trimmed}/plugins/${repo}"
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

while getopts ":o:d:a:r:" opt; do
  case ${opt} in
  o)
    os_version=$OPTARG
    ;;
  d)
    osd_version=$OPTARG
    ;;
  a)
    agents_up=$OPTARG
    ;;
  r)
    repo_spec=$OPTARG
    if [[ "$repo_spec" != *=* ]]; then
      exit_with_message "Invalid repository specification '${repo_spec}'. Expected format repo=/absolute/path." >&2
    fi
    repo_name=${repo_spec%%=*}
    repo_path=${repo_spec#*=}
    if [[ -z "$repo_name" || -z "$repo_path" ]]; then
      exit_with_message "Invalid repository specification '${repo_spec}'. Expected format repo=/absolute/path." >&2
    fi
    if [[ "$repo_path" != "/" ]]; then
      repo_path="${repo_path%/}"
    fi
  USER_REPOS+="${repo_name}%${repo_path}"$'\n'
    ;;
  \?)
    exit_with_message "Invalid option: -$OPTARG" >&2
    ;;
  :)
    exit_with_message "The -$OPTARG option requires an argument." >&2
    ;;
  esac
done
shift $((OPTIND - 1))

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
if [[ ${#external_dynamic_repos[@]} -gt 0 ]]; then
  echo "[INFO] Generating dynamic compose override for external repositories: ${external_dynamic_repos[*]}"
  {
    echo "services:"
    echo "  osd:"
    echo "    volumes:"  # This will append to existing volumes list
    for repo in "${external_dynamic_repos[@]}"; do
      echo "      - '${repo}:/home/node/kbn/plugins/${repo}'"
    done
    echo "volumes:"
    for repo in "${external_dynamic_repos[@]}"; do
      var_name=$(to_env_var_name "$repo")
      repo_path=${!var_name}
      repo_path=${repo_path%$'\n'}
      if [[ -z "$repo_path" ]]; then
        exit_with_message "Repository path for '$repo' not resolved."
      fi
      cat <<EOF
  ${repo}:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ${repo_path}
EOF
    done
  } > "${override_file}"
else
  # Remove stale override file if present
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
