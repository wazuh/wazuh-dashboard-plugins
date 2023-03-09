#!/usr/bin/env bash

elastic_versions=(
	"7.17.8"
	"8.0.1"
	"8.1.3"
	"8.2.3"
	"8.3.3"
	"8.4.3"
	"8.5.3"
	"8.6.0"
)


usage() {
	echo
	echo "$0 elastic_version  action "
	echo
	echo "where"
	echo "  elastic_version is one of " ${elastic_versions[*]}
	echo "  action is one of up | down | stop"
	exit -1
}

if [ $# -ne	2 ]
  then
  	echo "Incorrect number of arguments " $#
	usage
fi

if [[ ! " ${elastic_versions[*]} " =~ " ${1} " ]]
 then
 	echo "Version ${1} not found in ${elastic_versions[*]}"
 	exit -1
fi


export STACK_VERSION=$1
export ELASTIC_PASSWORD=${PASSWORD:-SecretPassword}
export KIBANA_PASSWORD=${PASSWORD:-SecretPassword}
export CLUSTER_NAME=cluster
export LICENSE=basic # or trial
export KIBANA_PORT=${PORT:-5611}
export COMPOSE_PROJECT_NAME=es-rel-${STACK_VERSION//./}

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
		docker compose -f rel.yml -p ${COMPOSE_PROJECT_NAME} stop
		;;
	*)
		usage
		;;
esac
