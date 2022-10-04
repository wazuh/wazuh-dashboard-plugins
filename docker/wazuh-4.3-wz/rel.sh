#!/usr/bin/env bash

versions=(
	"4.3.0"
	"4.3.1"
	"4.3.2"
	"4.3.3"
	"4.3.4"
	"4.3.5"
	"4.3.6"
	"4.3.7"
	"4.3.8"
)

usage() {
	echo
	echo "$0 version action "
	echo
	echo "where version is one of " ${versions[*]}
	echo "acction is one of up | down | stop"
	exit -1
}

if [ $# -lt	2 ]
  then
  	echo "Incorrect number of arguments " $#
    usage
fi

if [[ ! " ${versions[*]} " =~ " ${1} " ]]
 then
 	echo "Version ${1} not found in ${versions[*]}"
 	exit -1
fi

export WAZUH_STACK=${1}
export KIBANA_PORT=5601
export KIBANA_PASSWORD=${PASSWORD:-SecretPassword}
export COMPOSE_PROJECT_NAME=wz-rel-${WAZUH_STACK//./}

profile="standard"
export WAZUH_DASHBOARD_CONF=./config/wazuh_dashboard/wazuh_dashboard.yml

if [[ "$3" =~ "saml" ]]
then
	profile="saml"
	export WAZUH_DASHBOARD_CONF=./config/wazuh_dashboard/wazuh_dashboard_saml.yml
fi

case "$2" in
	up)
		# recreate volumes
		docker compose --profile $profile -f rel.yml up -Vd
		if [[ "${profile}" =~ "saml" ]]
		then
			./enable_saml.sh ${COMPOSE_PROJECT_NAME}
		fi
		;;
	down)
		# delete volumes
		docker compose --profile $profile -f rel.yml down -v --remove-orphans
		;;
	stop)
		docker compose --profile $profile -f rel.yml -p ${COMPOSE_PROJECT_NAME} stop
		;;
	*)
		echo "Action must be either up or down"
		usage
		;;
esac
