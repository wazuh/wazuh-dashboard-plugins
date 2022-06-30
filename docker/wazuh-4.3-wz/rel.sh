#!/usr/bin/env bash

versions=(
	"4.3.0"
	"4.3.1"
	"4.3.2"
	"4.3.3"
	"4.3.4"
	"4.3.5"
	)

usage() {
	echo
	echo "$0 version action "
	echo
	echo "where version is one of " ${versions[*]}
	echo "acction is one of up | down | stop"
	exit -1
}

if [ $# -ne	2 ]
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
export COMPOSE_PROJECT_NAME=wz-rel-${WAZUH_STACK}

case "$2" in
	up)
		# recreate volumes
		docker compose -f rel.yml up -Vd
		;;
	down)
		# delete volumes
		docker compose -f rel.yml down -v --remove-orphans
		;;
	stop)
		docker compose -f rel.yml stop
		;;
	*)
		echo "Action must be either up or down"
		usage
		;;
esac
