#!/usr/bin/env bash

elastic_versions=(
	"7.16.0"
	"7.16.1"
	"7.16.2"
	"7.16.3"
	"7.17.0"
	"7.17.1"
	"7.17.2"
	"7.17.3"
	"7.17.4"
	"7.17.5"
	"7.17.6"
	"7.17.7"
	"7.17.8"
	"7.17.9"
	"7.17.10"
  "7.17.11"
)

wazuh_versions=(
	"4.3.0"
	"4.3.1"
	"4.3.2"
	"4.3.3"
	"4.3.4"
	"4.3.5"
	"4.3.6"
	"4.3.7"
	"4.3.8"
	"4.3.9"
	"4.3.10"
	"4.4.0"
	"4.4.1"
	"4.4.2"
	"4.4.3"
	"4.4.4"
	"4.5.0"
	"4.5.1"
)

usage() {
	echo
	echo "$0 elastic_version wazuh_manager_version action "
	echo
	echo "where"
	echo "  elastic_version is one of " ${elastic_versions[*]}
	echo "  wazuh_manager_version if one of " ${wazuh_versions[*]}
	echo "  action is one of up | down | stop"
	exit -1
}

if [ $# -ne 3 ]; then
	echo "Incorrect number of arguments " $#
	usage
fi

if [[ ! " ${elastic_versions[*]} " =~ " ${1} " ]]; then
	echo "Version ${1} not found in ${elastic_versions[*]}"
	exit -1
fi

if [[ ! " ${wazuh_versions[*]} " =~ " ${2} " ]]; then
	echo "Version ${2} not found in ${wazuh_versions[*]}"
	exit -1
fi

export ES_VERSION=$1
export WAZUH_VERSION=$2
export ELASTIC_PASSWORD=${PASSWORD:-SecretPassword}
export KIBANA_PASSWORD=${PASSWORD:-SecretPassword}
export CLUSTER_NAME=cluster
export LICENSE=basic # or trial
export KIBANA_PORT=${PORT:-5601}
export COMPOSE_PROJECT_NAME=es-rel-${ES_VERSION//./}

case "$3" in
up)
	# recreate volumes
	docker compose -f rel.yml up -Vd

	# This installs Wazuh and integrates with a default Elastic stack
	# v=$( echo -n $ES_VERSION | sed 's/\.//g' )
	echo
	echo "Install Wazuh ${WAZUH_VERSION} into Elastic ${ES_VERSION} manually with:"
	echo
	echo "1. Install the Wazuh app for Kibana"
	echo "docker exec -ti ${COMPOSE_PROJECT_NAME}-kibana-1 /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/4.x/ui/kibana/wazuh_kibana-${WAZUH_VERSION}_${ES_VERSION}-1.zip"
	echo
	echo "2. Restart Kibana"
	echo "docker restart ${COMPOSE_PROJECT_NAME}-kibana-1"
	echo
	echo "3. Configure Kibana"
	echo "docker cp ./config/kibana/wazuh.yml ${COMPOSE_PROJECT_NAME}-kibana-1:/usr/share/kibana/data/wazuh/config/"
	echo
	echo "4. Open Kibana in a browser:"
	echo "http://localhost:${KIBANA_PORT}"
	echo
	echo "5. (Optional) Enroll an agent (Ubuntu 20.04):"
	echo "docker run --name ${COMPOSE_PROJECT_NAME}-agent --network ${COMPOSE_PROJECT_NAME} --label com.docker.compose.project=${COMPOSE_PROJECT_NAME} -d ubuntu:20.04 bash -c '"
	echo "  apt update -y"
	echo "  apt install -y curl lsb-release"
	echo "  curl -so \wazuh-agent-${WAZUH_VERSION}.deb \\"
	echo "    https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${WAZUH_VERSION}-1_amd64.deb \\"
	echo "    && WAZUH_MANAGER='wazuh.manager' WAZUH_AGENT_GROUP='default' dpkg -i ./wazuh-agent-${WAZUH_VERSION}.deb"
	echo
	echo "  /etc/init.d/wazuh-agent start"
	echo "  tail -f /var/ossec/logs/ossec.log"
	echo "'"
	echo
	;;
down)
	# delete volumes
	docker compose -f rel.yml down -v --remove-orphans
	;;
stop)
	docker compose -f rel.yml -p ${COMPOSE_PROJECT_NAME} stop
	;;
*)
	usage
	;;
esac
