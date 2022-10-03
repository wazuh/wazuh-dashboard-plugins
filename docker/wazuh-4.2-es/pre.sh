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

wazuh_api_version=(
	"3"
	"7"
)

usage() {
	echo
	echo "./pre.sh elastic_version wazuh_api_version action "
	echo
	echo "where"
	echo "  elastic_version is one of " ${elastic_versions[*]}
	echo "  wazuh_api_version is the patch version of wazuh 4.2, for example " ${wazuh_api_version[*]}
	echo "  action is one of up | down | stop"
	echo
	echo "In a minor release, the API should not change the version here bumps the API"
	echo " string returned for testing. This script generates the file "
	echo
	echo "    config/imposter/api_info.json"
	echo
	echo "used by the mock server"
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

[ -n "$2" ] && [ "$2" -eq "$2" ] 2>/dev/null
if [ $? -ne 0 ]; then
   echo "$2 is not number"
   exit -1
fi

patch_version=$2
cat << EOF > config/imposter/api_info.json
{
  "data": {
    "title": "Wazuh API REST",
    "api_version": "4.2.${patch_version}",
    "revision": 40316,
    "license_name": "GPL 2.0",
    "license_url": "https://github.com/wazuh/wazuh/blob/4.3/LICENSE",
    "hostname": "imposter",
    "timestamp": "2022-06-13T17:20:03Z"
  },
  "error": 0
}
EOF

export ES_VERSION=$1
export WAZUH_VERSION=$2
export ELASTIC_PASSWORD=${PASSWORD:-SecretPassword}
export KIBANA_PASSWORD=${PASSWORD:-SecretPassword}
export CLUSTER_NAME=cluster
export LICENSE=basic # or trial
export KIBANA_PORT=${PORT:-5601}
export COMPOSE_PROJECT_NAME=es-pre-${ES_VERSION//./}

case "$3" in
	up)
		# recreate volumes
		docker compose -f pre.yml up -Vd

		# This installs Wazuh and integrates with a default elastic stack
		# v=$( echo -n $ES_VERSION | sed 's/\.//g' )
    echo
		echo "Install the pre-release package manually with:"
    echo
    echo "1. Copy the pre-release package to the running Kibana container:"
		echo "docker cp wazuh_kibana-4.2.${patch_version}_${ES_VERSION}-1.zip ${COMPOSE_PROJECT_NAME}-kibana-1:/tmp"
    echo
    echo "2. Install the pre-release package:"
		echo "docker exec -ti ${COMPOSE_PROJECT_NAME}-kibana-1 /usr/share/kibana/bin/kibana-plugin install file:///tmp/wazuh_kibana-4.2.${patch_version}_${ES_VERSION}-1.zip"
    echo
    echo "3. Restart Kibana:"
		echo "docker restart ${COMPOSE_PROJECT_NAME}-kibana-1"
    echo
    echo "4. Upload the Wazuh app configuration:"
		echo "docker cp ./config/kibana/wazuh.yml ${COMPOSE_PROJECT_NAME}-kibana-1:/usr/share/kibana/data/wazuh/config/"
    echo
    echo "5. Open Kibana in a browser:"
    echo "http://localhost:${KIBANA_PORT}"
    echo
		;;
	down)
		# delete volumes
		docker compose -f pre.yml down -v --remove-orphans
		;;
	stop)
		docker compose -f pre.yml -p ${COMPOSE_PROJECT_NAME} stop
		;;
	*)
		usage
		;;
esac
