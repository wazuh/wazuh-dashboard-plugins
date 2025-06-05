#!/bin/bash

usage() {
  echo
  echo "./dev.sh [-os os_version] [-osd osd_version] [-a agents_up] /wazuh_app_src action [saml/server/server-local] [server_version]"
  echo
  echo "where"
  echo "  -o os_version Specify the OS version (optional)"
  echo "  -d osd_version Specify the OSD version (optional)"
  echo "  -a agents_up Specify 'rpm' or 'deb' to deploy an agent with server-local, or 'without' to deploy no agent  (optional) (default: deploy 2 agents)"
  echo "  wazuh_app_src is the path to the wazuh application source code"
  echo "  action is one of up | down | stop | start"
  echo "  saml to deploy a saml enabled environment (optional)"
  echo "  server to deploy a real server enabled environment (optional)"
  echo "  server-local to deploy a real server enabled environment (optional)"
  exit -1
}

exit_with_message() {
  echo $1
  exit -1
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

while getopts ":o:d:a:" opt; do
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
  \?)
    echo "Invalid option: -$OPTARG" >&2
    exit 1
    ;;
  :)
    echo "The -$OPTARG option requires an argument." >&2
    exit 1
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

if [ $# -lt 2 ]; then
  echo "[ERROR] Incorrect number of arguments " $# ", got " $@
  echo
  usage
fi

if [[ $1 != /* ]]; then
  echo "[ERROR] Source path must be absolute, and start with /"
  echo
  usage
  exit
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
export WAZUH_VERSION_DEVELOPMENT=$(jq -r '.version' $PACKAGE_PATH)

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

if [[ "$3" =~ "server-local" ]]; then

  if [[ -n "$agents_up" ]]; then
    profile="server-local-${agents_up}"
  else
    profile="server-local"
  fi
  export IMAGE_TAG="${4}"
fi

export SEC_CONFIG_PATH=/usr/share/opensearch/plugins/opensearch-security/securityconfig
if [[ "$OSD_MAJOR" == "2.x" ]]; then
  export SEC_CONFIG_PATH=/usr/share/opensearch/config/opensearch-security
fi

case "$2" in
up)
  /bin/bash ../scripts/create_docker_networks.sh
  docker compose --profile $profile -f dev.yml up -Vd

  # Display a command to deploy an agent when using the real server
  if [[ "$3" =~ "^server$" ]]; then
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
  docker compose --profile $profile -f dev.yml start
  ;;
down)
  docker compose --profile $profile -f dev.yml down -v --remove-orphans
  ;;
stop)
  docker compose --profile $profile -f dev.yml -p ${COMPOSE_PROJECT_NAME} stop
  ;;
manager-local-up)
  docker compose --profile $profile -f dev.yml -p ${COMPOSE_PROJECT_NAME} up -d wazuh.manager.local
  ;;
*)
  echo "[ERROR] Action must be up | down | stop: "
  echo
  usage
  ;;
esac
