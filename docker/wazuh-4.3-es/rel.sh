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
)

wazuh_versions=(
	"4.3.0"
	"4.3.1"
	"4.3.2"
	"4.3.3"
	"4.3.4"
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

if [ $# -ne	3 ]
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
export COMPOSE_PROJECT_NAME=es-rel-$STACK_VERSION

case "$3" in
	up)
		# recreate volumes
		docker compose -f rel.yml up -Vd

		# This installs Wazuh and integrates with a default elastic stack
		v=$( echo -n $STACK_VERSION | sed 's/\.//g' )
		echo
		echo Install Wazuh ${WAZUH_STACK} into Elastic ${STACK_VERSION} manually with:
		echo
		echo docker exec -ti  elastic-${v}_kibana_1  /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/4.x/ui/kibana/wazuh_kibana-${WAZUH_STACK}_${STACK_VERSION}-1.zip
		echo docker restart elastic-${v}_kibana_1
		echo docker cp ./config/kibana/wazuh.yml elastic-${v}_kibana_1:/usr/share/kibana/data/wazuh/config/
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
