#!/bin/bash

os_versions=(
  '1.2.4'
  # '2.0.0' # compatibility.override_main_response_version deprecated
  '2.1.0'
  '2.2.1'
  '2.3.0'
  '2.4.0'
  '2.4.1'
  '2.6.0'
  '2.8.0'
  '2.9.0'
  '2.10.0'
  '2.11.0'
  '2.11.1'
  '2.12.0'
  '2.13.0'
  '2.14.0'
  '2.15.0'
  '2.16.0'
  '2.17.1'
)

osd_versions=(
  '1.2.0'
  # '2.0.0' # compatibility.override_main_response_version deprecated
  '2.1.0'
  '2.2.1'
  '2.3.0'
  '2.4.0'
  '2.4.1'
  '2.6.0'
  '2.8.0'
  '2.9.0'
  '2.10.0'
  '2.11.0'
  '2.11.1'
  '2.12.0'
  '2.13.0'
  '2.14.0'
  '2.15.0'
  '2.16.0'
  '2.17.1'
)

wzs_version=(
  '4.7.0'
  '4.7.1'
  '4.7.2'
  '4.7.3'
  '4.7.4'
  '4.7.5'
  '4.8.0'
  '4.8.1'
)

usage() {
  echo
  echo "./dev.sh os_version osd_version /wazuh_app_src action [saml/server] [server_version]"
  echo
  echo "where"
  echo "  os_version is one of " ${os_versions[*]}
  echo "  osd_version is one of " ${osd_versions[*]}
  echo "  wazuh_app_src is the path to the wazuh application source code"
  echo "  action is one of up | down | stop"
  echo "  saml to deploy a saml enabled environment"
  echo "  server to deploy a real server enabled environment"
  exit -1
}

exit_with_message() {
  echo $1
  exit -1
}

if [ $# -lt 4 ]; then
  echo "Incorrect number of arguments " $# ", got " $@
  echo
  usage
fi

if [[ ! " ${os_versions[*]} " =~ " ${1} " ]]; then
  echo "OS version ${1} not found in ${os_versions[*]}"
  echo
  exit -1
fi

if [[ ! " ${osd_versions[*]} " =~ " ${2} " ]]; then
  echo "OSD version ${1} not found in ${osd_versions[*]}"
  echo
  exit -1
fi

if [[ $3 != /* ]]; then
  echo "Source path must be absolute, and start with /"
  echo
  usage
  exit
fi

export PASSWORD=${PASSWORD:-admin}
export OS_VERSION=$1
export OSD_VERSION=$2
export OSD_PORT=${PORT:-5601}
export IMPOSTER_PORT=8081
export SRC=$3
export OSD_MAJOR_NUMBER=$(echo $OSD_VERSION | cut -d. -f1)
export COMPOSE_PROJECT_NAME=os-dev-${OSD_VERSION//./}

if [[ "$OSD_MAJOR_NUMBER" -ge 2 ]];
then
  export OSD_MAJOR="2.x"
else
  export OSD_MAJOR="1.x"
fi

profile="standard"
export WAZUH_DASHBOARD_CONF=./config/${OSD_MAJOR}/osd/opensearch_dashboards.yml
export SEC_CONFIG_FILE=./config/${OSD_MAJOR}/os/config.yml
if [[ "$5" =~ "saml" ]]; then
  cat /etc/hosts | grep -q "idp" || exit_with_message "Add idp to /etc/hosts"

  profile="saml"
  export WAZUH_DASHBOARD_CONF=./config/${OSD_MAJOR}/osd/opensearch_dashboards_saml.yml
  export SEC_CONFIG_FILE=./config/${OSD_MAJOR}/os/config-saml.yml
fi

if [[ "$5" =~ "server" ]]; then
  profile="server"
  if [[ ! " ${wzs_version[*]} " =~ " ${6} " ]]; then
    echo "Wazuh server version ${6} not found in ${wzs_version[*]}"
    echo
    exit -1
  fi
  export WAZUH_STACK="${6}"
fi

export SEC_CONFIG_PATH=/usr/share/opensearch/plugins/opensearch-security/securityconfig
if [[ "$OSD_MAJOR" == "2.x" ]]; then
  export SEC_CONFIG_PATH=/usr/share/opensearch/config/opensearch-security
fi

case "$4" in
up)
  /bin/bash ../scripts/create_docker_networks.sh
  docker compose --profile $profile -f dev.yml up -Vd

  # Display a command to deploy an agent when using the real server
  if [[ "$5" =~ "server" ]]; then
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
down)
  docker compose --profile $profile -f dev.yml down -v --remove-orphans
  ;;
stop)
  docker compose --profile $profile -f dev.yml -p ${COMPOSE_PROJECT_NAME} stop
  ;;
*)
  echo "Action must be up | down | stop: "
  echo
  usage
  ;;
esac
