#!/bin/bash

ROOT_DIR=$(git rev-parse --show-toplevel)

source $ROOT_DIR/docker/scripts/style_text.sh

COMPOSE_FILE=dev.yml
PACKAGE_PATH="$ROOT_DIR/plugins/wazuh-core/package.json"
os_version=""
osd_version=""
WAZUH_HOME="$ROOT_DIR/plugins"
SAML=false
SERVER=false
ACTION=""
WAZUH_STACK=""
# https://docs.docker.com/compose/how-tos/environment-variables/envvars/#compose_profiles
# https://docs.docker.com/compose/how-tos/profiles/#start-multiple-profiles
COMPOSE_PROFILE=""
ENTRYPOINT="yarn start --no-base-path"

usage() {
  echo
  echo "$(styleText -b -u Usage): $0 [$(printGreen -- "-os <os_version>")] [$(printGreen -- "-osd <osd_version>")] [$(printGreen -- "--wz-home <wazuh_app_source>")] [$(printGreen -- "-saml")] [$(printGreen -- "--server <server_version>")] [$(printGreen -- "--no-start")] $(printGreen -- "-a"), $(printGreen -- "--action <action>")"
  echo
  echo "$(styleText -b -u Options):"
  {
    echo "  $(printGreen -- "-os <os_version>") @ ($(printGray optional)) Specify the OS version"
    echo "  $(printGreen -- "-osd <osd_version>") @ ($(printGray optional)) Specify the OSD version"
    echo "  $(printGreen -- "--wz-home <wazuh_app_source>") @ ($(printGray optional)) The path where the wazuh application source code is located. ( Default: '$(printCyan -- "$ROOT_DIR/plugins")' )"
    echo "  $(printGreen -- "-saml") @ ($(printGray optional)) To deploy a $(styleText -u "saml") enabled environment"
    echo "  $(printGreen -- "--server <server_version>") @ ($(printGray optional)) To deploy a $(styleText -u "real server") enabled environment"
    echo "  $(printGreen -- "--no-start") @ ($(printGray optional)) Keep the osd container idle without starting the service (useful for debugging or manual initialization)"
    echo "  $(printGreen -- "-a"), $(printGreen -- "--action <action>") @ Action to perform, one of: $(printCyan -- "up | down | stop | start | restart")"
    echo "  $(printGreen -- "--help") @ Display this help message"
  } | column -t -s '@'
  exit -1
}

exit_with_message() {
  printError "$1"
  exit -1
}

if ! command -v jq &>/dev/null; then
  echo
  printError "'$(printCyan -b -i jq)' is not installed. Please install '$(printCyan -b -i jq)' to continue."
  echo
  {
    printCommand "$(printGreen "sudo apt-get") install -y jq @ $(printGray "# in Debian/Ubuntu OS")"
    printCommand "$(printGreen "sudo yum") install jq @ $(printGray "# in RedHat/CentOS OS")"
    printCommand "$(printGreen "sudo pacman") -Sy --noconfirm jq @ $(printGray "# in Arch OS")"
    printCommand "$(printGreen "brew") install jq @ $(printGray "# in MAC OS")"
  } | column -t -s '@'
  echo
  exit 1
fi

required_argument() {
  if [[ -z "$1" || "$1" == -* ]]; then
    printError "Option '$(printGreen -b -- $2)' requires an argument"
    usage
  fi
}

MAJOR_MINOR_PATCH_PATTERN="[0-9]+(\.[0-9]+){2}"
VERSIONING_SUFFIX_PATTERN="(-${MAJOR_MINOR_PATCH_PATTERN})?(\.[a-z]+)?"
VERSION_PATTERN="^${MAJOR_MINOR_PATCH_PATTERN}${VERSIONING_SUFFIX_PATTERN}$"
validate_argument() {
  local arg="$1"
  local pattern="$2"
  local name="$3"

  if [[ ! "$arg" =~ $pattern ]]; then
    printError "Invalid $(styleText -b -- "$name"): '$(printGreen -b -- $arg)'. It must match pattern: '$(printCyan -b -- $pattern)'"
    usage
  fi
}

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
  -os)
    required_argument "$2" "$key"
    validate_argument "$2" "$VERSION_PATTERN" "OS version"
    os_version="$2"
    shift 2
    ;;
  -osd)
    required_argument "$2" "$key"
    validate_argument "$2" "$VERSION_PATTERN" "OSD version"
    osd_version="$2"
    shift 2
    ;;
  --wz-home)
    required_argument "$2" "$key"
    # Convert to absolute path if relative
    if [[ ! "$2" = /* ]]; then
      WAZUH_HOME=$(realpath "$2")
    else
      WAZUH_HOME="$2"
    fi
    # Validate that path exists
    if [[ ! -d "$WAZUH_HOME" ]]; then
      printError "The directory '$(printCyan -b -- $WAZUH_HOME)' does not exist"
      usage
    fi
    shift 2
    ;;
  -saml)
    SAML=true
    COMPOSE_PROFILE=${COMPOSE_PROFILE:+$COMPOSE_PROFILE,}saml
    shift
    ;;
  --server)
    required_argument "$2" "$key"
    validate_argument "$2" "$VERSION_PATTERN" "Server version"
    SERVER=true
    COMPOSE_PROFILE=${COMPOSE_PROFILE:+$COMPOSE_PROFILE,}server
    WAZUH_STACK="$2"
    shift 2
    ;;
  -a | --action)
    required_argument "$2" "$key"
    validate_argument "$2" "^(up|down|stop|start|restart)$" "Action"
    ACTION="$2"
    shift 2
    ;;
  --no-start)
    ENTRYPOINT="tail -f /dev/null"
    shift
    ;;
  --help)
    usage
    ;;
  *)
    printError "Unknown option: '$(printGreen -b -- $1)'"
    usage
    ;;
  esac
done

if [ -z $COMPOSE_PROFILE ]; then
  COMPOSE_PROFILE="standard"
fi

printInfo "Running with profiles: $(printCyan -b $COMPOSE_PROFILE)"
echo

# Check if action is provided
if [ -z "$ACTION" ]; then
  printError "No action specified. Please provide an action with $(printGreen -b -- "-a") or $(printGreen -b -- "--action")."
  echo
  usage
fi

# Install dependencies for each plugin in $WAZUH_HOME
for plugin in $(ls $WAZUH_HOME); do
  if [ -f "$WAZUH_HOME/$plugin/package.json" ] && [ ! -d "$WAZUH_HOME/$plugin/node_modules" ]; then
    pushd $WAZUH_HOME/$plugin
    yarn install
    popd
  fi
done

if [ "$SAML" = true ]; then
  cat /etc/hosts | grep -q "idp" || exit_with_message "Add $(printGreen -i -b -- "127.0.0.1 idp") to $(printCyan -u -- "/etc/hosts")"
fi

# Function to get version from package.json
get_version_from_package() {
  local version_type=$1
  local version_var=$2

  if [ -z "${!version_var}" ]; then
    if [ ! -f $PACKAGE_PATH ]; then
      printError "The file $PACKAGE_PATH was not found."
      exit 1
    fi

    local version=$(jq -r '.pluginPlatform.version' $PACKAGE_PATH)
    printInfo "$(styleText -u -- "$version_type Version") not received via flag, getting the version from $(printCyan -u $PACKAGE_PATH). Using: $(printYellow -b $version)"

    if [ -z "$version" ]; then
      printError "Could not retrieve the $(styleText -u -- $version_type) version from $PACKAGE_PATH."
      exit 1
    fi

    eval "$version_var=$version"
  fi
}

# Get versions from package.json if not provided
get_version_from_package "OS" "os_version"
get_version_from_package "OSD" "osd_version"

# ---------------------------------------------------------------------------- #
#                                    EXPORTS                                   #
# ---------------------------------------------------------------------------- #

export PASSWORD=${PASSWORD:-admin}
export OS_VERSION=$os_version
export OSD_VERSION=$osd_version
export OSD_PORT=${PORT:-5601}
export IMPOSTER_VERSION=3.44.1
export SRC=$WAZUH_HOME
export OSD_MAJOR_NUMBER=$(echo $OSD_VERSION | cut -d. -f1)
export COMPOSE_PROJECT_NAME=os-dev-${OSD_VERSION//./}
export WAZUH_STACK=$WAZUH_STACK
export ENTRYPOINT=$ENTRYPOINT

if [[ "$OSD_MAJOR_NUMBER" -ge 2 ]]; then
  export OSD_MAJOR="2.x"
else
  export OSD_MAJOR="1.x"
fi

export WAZUH_DASHBOARD_CONF=./config/${OSD_MAJOR}/osd/opensearch_dashboards.yml
export SEC_CONFIG_FILE=./config/${OSD_MAJOR}/os/config.yml
if [ "$SAML" = true ]; then
  export WAZUH_DASHBOARD_CONF=./config/${OSD_MAJOR}/osd/opensearch_dashboards_saml.yml
  export SEC_CONFIG_FILE=./config/${OSD_MAJOR}/os/config-saml.yml
fi

export SEC_CONFIG_PATH=/usr/share/opensearch/plugins/opensearch-security/securityconfig
if [[ "$OSD_MAJOR" == "2.x" ]]; then
  export SEC_CONFIG_PATH=/usr/share/opensearch/config/opensearch-security
fi

# ---------------------------------------------------------------------------- #
#                                  RUN ACTION                                  #
# ---------------------------------------------------------------------------- #

run_docker_compose() {
  docker compose \
    ${COMPOSE_PROFILE:+--profile=${COMPOSE_PROFILE//,/ --profile=}} \
    -p $COMPOSE_PROJECT_NAME \
    -f $COMPOSE_FILE \
    "$@"
}

echo
case "$ACTION" in
up)
  printInfo "Creating networks and starting containers..."
  echo

  /bin/bash ../scripts/create_docker_networks.sh
  run_docker_compose up --renew-anon-volumes --detach

  # Display a command to deploy an agent when using the real server
  if [ "$SERVER" = true ]; then
    echo
    printWarn "$(printYellow -b "************* WARNING *************")"
    printWarn "$(printYellow "The agent version must be a published one. This uses only released versions.")"
    printWarn "$(printYellow "If you need to change de version, edit the command as you see fit.")"
    printWarn "$(printYellow -b "***********************************")"
    echo
    echo "($(printGray -b Optional)) Enroll an agent ($(printCyan -b "Ubuntu 20.04")):"
    echo
    printCommand "docker run --name ${COMPOSE_PROJECT_NAME}-agent-\$(date +%s) --network os-dev-${OS_VERSION} --label com.docker.compose.project=${COMPOSE_PROJECT_NAME} --env WAZUH_AGENT_VERSION=${WAZUH_STACK} -d ubuntu:20.04 bash -c '"
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
down)
  printInfo "Removing containers and volumes..."
  echo
  run_docker_compose down --volumes --remove-orphans
  ;;
start)
  printInfo "Starting containers..."
  echo
  run_docker_compose start
  ;;
stop)
  printInfo "Stopping containers..."
  echo
  run_docker_compose stop
  ;;
restart)
  printInfo "Restarting osd service..."
  echo
  SERVICE="osd"
  run_docker_compose restart $SERVICE
  ;;
*)
  echo
  usage
  ;;
esac
