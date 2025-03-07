#!/bin/bash

ROOT_DIR=$(git rev-parse --show-toplevel)

source $ROOT_DIR/docker/scripts/style_text.sh

usage() {
  echo
  echo "$(styleText -b -u Usage): $0 [$(printGreen -- "-os <os_version>")] [$(printGreen -- "-osd <osd_version>")] [$(printGreen -- "--wz-home <wazuh_app_source>")] [$(printGreen -- "--saml") | $(printGreen -- "--server <server_version>")] ($(printGreen -- "-a"), $(printGreen -- "--action <action>"))"
  echo
  echo "$(styleText -b -u Options):"
  {
    echo "  $(printGreen -- "-os <os_version>") @ ($(printGray optional)) Specify the OS version"
    echo "  $(printGreen -- "-osd <osd_version>") @ ($(printGray optional)) Specify the OSD version"
    echo "  $(printGreen -- "--wz-home <wazuh_app_source>") @ ($(printGray optional)) The path where the wazuh application source code is located. ( Default: '$(printCyan -- "$ROOT_DIR/plugins")' )"
    echo "  $(printGreen -- "--saml") @ ($(printGray optional)) To deploy a $(styleText -u "saml") enabled environment"
    echo "  $(printGreen -- "--server <server_version>") @ ($(printGray optional)) To deploy a $(styleText -u "real server") enabled environment"
    echo "  $(printGreen -- "-a"), $(printGreen -- "--action <action>") @ Action to perform, one of: $(printCyan -- "up | down | stop | start")"
    echo "  $(printGreen -- "--help") @ Display this help message"
  } | column -t -s '@'
  exit -1
}

exit_with_message() {
  echo $1
  exit -1
}

if ! command -v jq &>/dev/null; then
  echo
  printError "'$(printCyan -b -i jq)' is not installed. Please install '$(printCyan -b -i jq)' to continue."
  echo
  {
    printCommand "sudo apt-get install jq @ $(printGray "# in Debian/Ubuntu OS")"
    printCommand "sudo yum install jq @ $(printGray "# in RedHat/CentOS OS")"
    printCommand "sudo pacman -Sy --noconfirm jq @ $(printGray "# in Arch OS")"
    printCommand "brew install jq @ $(printGray "# in MAC OS")"
  } | column -t -s '@'
  echo
  exit 1
fi

PACKAGE_PATH="$ROOT_DIR/plugins/wazuh-core/package.json"
os_version=""
osd_version=""

required_argument() {
  if [[ -z "$1" || "$1" == -* ]]; then
    printError "Option $(printGreen -b -- \'$2\') requires an argument"
    usage
  fi
}

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
  -os)
    required_argument "$2" "$key"
    os_version="$2"
    shift 2
    ;;
  -osd)
    required_argument "$2" "$key"
    osd_version="$2"
    shift 2
    ;;
  --wz-home)
    required_argument "$2" "$key"
    WAZUH_HOME="$2"
    shift 2
    ;;
  --saml)
    SAML=true
    shift
    ;;
  --server)
    required_argument "$2" "$key"
    SERVER=true
    WAZUH_STACK="$2"
    shift 2
    ;;
  -a | --action)
    required_argument "$2" "$key"
    ACTION="$2"
    shift 2
    ;;
  --help)
    usage
    ;;
  *)
    printError "Unknown option: $(printGreen -b -- \'$1\')"
    usage
    ;;
  esac
done

if [ -z "$os_version" ] || [ -z "$osd_version" ]; then
  if [ ! -f $PACKAGE_PATH ]; then
    printError "The file package.json was not found."
    exit 1
  fi

  if [ -z "$os_version" ]; then
    os_version=$(jq -r '.pluginPlatform.version' $PACKAGE_PATH)
    printInfo "OS Version not received via flag, getting the version from $(printCyan -u $PACKAGE_PATH). Using: $(printYellow -b $os_version)"
    if [ -z "$os_version" ]; then
      printError "Could not retrieve the OS version from package.json."
      exit 1
    fi
  fi

  if [ -z "$osd_version" ]; then
    osd_version=$(jq -r '.pluginPlatform.version' $PACKAGE_PATH)
    printInfo "OSD Version not received via flag, getting the version from $(printCyan -u $PACKAGE_PATH). Using: $(printYellow -b $osd_version)"
    if [ -z "$osd_version" ]; then
      printError "Could not retrieve the OSD version from package.json."
      exit 1
    fi
  fi
fi

export PASSWORD=${PASSWORD:-admin}
export OS_VERSION=$os_version
export OSD_VERSION=$osd_version
export OSD_PORT=${PORT:-5601}
export IMPOSTER_VERSION=3.44.1
export SRC=$1
export OSD_MAJOR_NUMBER=$(echo $OSD_VERSION | cut -d. -f1)
export COMPOSE_PROJECT_NAME=os-dev-${OSD_VERSION//./}
export WAZUH_STACK=""

if [[ "$OSD_MAJOR_NUMBER" -ge 2 ]]; then
  export OSD_MAJOR="2.x"
else
  export OSD_MAJOR="1.x"
fi

profile="standard"
export WAZUH_DASHBOARD_CONF=./config/${OSD_MAJOR}/osd/opensearch_dashboards.yml
export SEC_CONFIG_FILE=./config/${OSD_MAJOR}/os/config.yml
if [[ "$3" =~ "saml" ]]; then
  cat /etc/hosts | grep -q "idp" || exit_with_message "Add idp to /etc/hosts"

  profile="saml"
  export WAZUH_DASHBOARD_CONF=./config/${OSD_MAJOR}/osd/opensearch_dashboards_saml.yml
  export SEC_CONFIG_FILE=./config/${OSD_MAJOR}/os/config-saml.yml
fi

if [[ "$3" =~ "server" ]]; then
  profile="server"
  export WAZUH_STACK="${4}"
fi

export SEC_CONFIG_PATH=/usr/share/opensearch/plugins/opensearch-security/securityconfig
if [[ "$OSD_MAJOR" == "2.x" ]]; then
  export SEC_CONFIG_PATH=/usr/share/opensearch/config/opensearch-security
fi

# case "$2" in
# up)
#   /bin/bash ../scripts/create_docker_networks.sh
#   docker compose --profile $profile -f dev.yml up -Vd

#   # Display a command to deploy an agent when using the real server
#   if [[ "$3" =~ "server" ]]; then
#     echo
#     echo "**************WARNING**************"
#     echo "The agent version must be a published one. This uses only released versions."
#     echo "If you need to change de version, edit the command as you see fit."
#     echo "***********************************"
#     echo "1. (Optional) Enroll an agent (Ubuntu 20.04):"
#     echo "docker run --name ${COMPOSE_PROJECT_NAME}-agent-\$(date +%s) --network os-dev-${OS_VERSION} --label com.docker.compose.project=${COMPOSE_PROJECT_NAME} --env WAZUH_AGENT_VERSION=${WAZUH_STACK} -d ubuntu:20.04 bash -c '"
#     echo "  apt update -y"
#     echo "  apt install -y curl lsb-release"
#     echo "  curl -so \wazuh-agent-\${WAZUH_AGENT_VERSION}.deb \\"
#     echo "    https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_\${WAZUH_AGENT_VERSION}-1_amd64.deb \\"
#     echo "    && WAZUH_MANAGER='wazuh.manager' WAZUH_AGENT_GROUP='default' dpkg -i ./wazuh-agent-\${WAZUH_AGENT_VERSION}.deb"
#     echo
#     echo "  /etc/init.d/wazuh-agent start"
#     echo "  tail -f /var/ossec/logs/ossec.log"
#     echo "'"
#     echo
#   fi
#   ;;
# down)
#   docker compose --profile $profile -f dev.yml down -v --remove-orphans
#   ;;
# start)
#   docker compose --profile $profile -f dev.yml -p ${COMPOSE_PROJECT_NAME} start
#   ;;
# stop)
#   docker compose --profile $profile -f dev.yml -p ${COMPOSE_PROJECT_NAME} stop
#   ;;
# *)
#   echo "[ERROR] Action must be up | down | stop | start: "
#   echo
#   usage
#   ;;
# esac
