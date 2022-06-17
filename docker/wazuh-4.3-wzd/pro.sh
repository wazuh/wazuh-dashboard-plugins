#!/usr/bin/env bash

versions=(
	"4.3.0" 
	"4.3.1"
	"4.3.2"
	"4.3.3"
	"4.3.4"
	)

usage() {
	echo 
	echo "./pro.sh version action "
	echo 
	echo "where version is one of " ${versions[*]}
	echo "acction is one of up | down" 
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
export COMPOSE_PROJECT_NAME=wazuh-${WAZUH_STACK}

case "$2" in
	up)
		# recreate volumes
		docker-compose -f pro.yml up -Vd
		;;
	down)
		# delete volumes
		docker-compose -f pro.yml down -v --remove-orphans
		;;
	*)
		echo "Action must be either up or down"
		usage
		;;
esac
