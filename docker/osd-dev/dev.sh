#!/bin/bash

os_versions=(
	'1.2.4'
	'2.0.0'
	'2.1.0'
	'2.2.1'
)

osd_versions=(
	'1.2.0'
	'2.0.0'
	'2.1.0'
	'2.2.1'
)

usage() {
	echo
	echo "./dev.sh os_version osd_version /wazuh_app_src action "
	echo
	echo "where"
	echo "  os_version is one of " ${os_versions[*]}
	echo "  osd_version is one of " ${osd_versions[*]}
	echo "  wazuh_app_src is the path to the wazuh application source code"
	echo "  action is one of up | down | stop"
	exit -1
}


if [ $# -lt 4 ]
  then
  	echo "Incorrect number of arguments " $# ", got " $@
  	echo
    usage
fi

if [[ ! " ${os_versions[*]} " =~ " ${1} " ]]
 then
 	echo "OS version ${1} not found in ${os_versions[*]}"
 	echo
 	exit -1
fi

if [[ ! " ${osd_versions[*]} " =~ " ${2} " ]]
 then
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
export OSD_MAJOR=`echo $OSD_VERSION | cut -d. -f1`.x
export COMPOSE_PROJECT_NAME=os-dev-${OSD_VERSION//./}

case "$4" in
	up)
		docker compose -f dev.yml up -Vd
		;;
	down)
		docker compose -f dev.yml down -v --remove-orphans
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
