#!/bin/bash

elastic_versions=(
	'7.10.2'
	'7.16.0'
	'7.16.1'
	'7.16.2'
	'7.16.3'
	'7.17.0'
	'7.17.4'
	'7.17.5'
	'7.17.6'
	'7.17.7'
	'7.17.8'
	'7.17.9'
	'7.17.10'
	'7.17.11'
	'8.0.0'
	'8.1.0'
	'8.2.1'
	'8.2.3'
	'8.3.0'
	'8.3.1'
	'8.3.3'
	'8.4.2'
	'8.4.3'
	'8.5.0'
)

usage() {
	echo
	echo "./dev.sh elastic_version /wazuh_app_src action "
	echo
	echo "where"
	echo "  elastic_version is one of " ${elastic_versions[*]}
	echo "  wazuh_app_src is the path to the wazuh application source code"
	echo "  action is one of up | down | stop"
	exit -1
}

if [ $# -ne 3 ]; then
	echo "Incorrect number of arguments " $# ", got " $@
	echo
	usage
fi

if [[ ! " ${elastic_versions[*]} " =~ " ${1} " ]]; then
	echo "Version ${1} not found in ${elastic_versions[*]}"
	echo
	exit -1
fi

if [[ $2 != /* ]]; then
	echo "Source path must be absolute, and start with /"
	echo
	usage
	exit
fi

export KIBANA_PASSWORD=${PASSWORD:-SecretPassword}
export ELASTIC_PASSWORD=${PASSWORD:-SecretPassword}
export ES_VERSION=$1
export LICENSE=basic # or trial
export KIBANA_PORT=${PORT:-5601}
export IMPOSTER_PORT=8080
export SRC=$2
export COMPOSE_PROJECT_NAME=es-dev-${ES_VERSION//./} # /./ removes dots: 7.10.2 => 7102

case "$3" in
up)
	docker compose -f dev.yml -p ${COMPOSE_PROJECT_NAME} up -Vd
	;;
down)
	docker compose -f dev.yml -p ${COMPOSE_PROJECT_NAME} down -v --remove-orphans
	;;
stop)
	docker compose -f dev.yml -p ${COMPOSE_PROJECT_NAME} stop
	;;
*)
	echo "Action must be up | down | stop: "
	echo
	usage
	;;
esac
