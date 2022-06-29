#!/usr/bin/env bash

elastic_versions=(
	"7.14.2"
	"7.14.1"
	"7.14.0"
	"7.13.4"
	"7.13.3"
	"7.13.2"
	"7.13.1"
	"7.13.0"
	"7.12.1"
	"7.11.2"
	"7.10.2"
)

wazuh_versions=(
	"4.2.7"
	"4.2.6"
	"4.2.5"
	"4.2.4"
	"4.2.3"
	"4.2.2"
	"4.2.1"
	"4.2.0"
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

if [ $# -ne 3 ]
  then
  	echo "Incorrect number of arguments " $#
    usage
fi

if [[ ! " ${elastic_versions[*]} " =~ " ${1} " ]]
 then
 	echo "Version ${1} not found in ${elastic_versions[*]}"
 	exit -1
fi

if [[ ! " ${wazuh_versions[*]} " =~ " ${2} " ]]
 then
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
export COMPOSE_PROJECT_NAME=es-rel-$ES_VERSION

case "$3" in
	up)
		# recreate volumes
		docker compose -f rel.yml up -Vd

		# This installs Wazuh and integrates with a default elastic stack
		v=$( echo -n $ES_VERSION | sed 's/\.//g' )
		echo
		echo Install Wazuh ${WAZUH_VERSION} into Elastic ${ES_VERSION} manually with:
		echo
		echo 1. Install wazuh kibana app
		echo docker exec -ti  es-rel-${v}-kibana-1  /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/4.x/ui/kibana/wazuh_kibana-${WAZUH_VERSION}_${ES_VERSION}-1.zip
		echo 2. Restart Kibana
		echo docker restart es-rel-${v}-kibana-1
		echo 3. Configure kibana
		echo docker cp ./config/kibana/wazuh.yml es-rel-${v}-kibana-1:/usr/share/kibana/data/wazuh/config/
		;;
	down)
		# delete volumes
		docker compose -f rel.yml down -v --remove-orphans
		;;
	stop)
		docker compose -f rel.yml stop
		;;
	*)
		usage
		;;
esac
