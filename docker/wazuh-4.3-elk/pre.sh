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

wazuh_api_version=(
	"5"
	"17"
)

usage() {
	echo
	echo "./pre.sh elastic_version wazuh_api_version action "
	echo
	echo "where"
	echo "  elastic_version is one of " ${elastic_versions[*]}
	echo "  wazuh_api_version is the minor version of wazuh 4.3, for example " ${wazuh_api_version[*]}
	echo "  action is one of up | down"
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
    "api_version": "4.3.${patch_version}",
    "revision": 40316,
    "license_name": "GPL 2.0",
    "license_url": "https://github.com/wazuh/wazuh/blob/4.3/LICENSE",
    "hostname": "imposter",
    "timestamp": "2022-06-13T17:20:03Z"
  },
  "error": 0
}
EOF

export STACK_VERSION=$1

export WAZUH_STACK=4.3.${patch_version}

# Password for the 'elastic' user (at least 6 characters)
export ELASTIC_PASSWORD=SecretPassword

# Password for the 'kibana_system' user (at least 6 characters)
export KIBANA_PASSWORD=SecretPassword

# Set the cluster name
export CLUSTER_NAME=cluster

# Set to 'basic' or 'trial' to automatically start the 30-day trial
export LICENSE=basic
#LICENSE=trial

# Port to expose Elasticsearch HTTP API to the host
export ES_PORT=9200
#ES_PORT=127.0.0.1:9200

# Port to expose Kibana to the host
export KIBANA_PORT=5602

# Increase or decrease based on the available host memory (in bytes)
export MEM_LIMIT=1073741824

export COMPOSE_PROJECT_NAME=elastic-$STACK_VERSION

case "$3" in
	up)
		# recreate volumes
		docker-compose -f pre.yml up -Vd

		# This installs Wazuh and integrates with a default elastic stack
		v=$( echo -n $STACK_VERSION | sed 's/\.//g' )
		echo Install Wazuh ${WAZUH_STACK} into Elastic ${STACK_VERSION} manually with:
		echo docker cp wazuh_kibana-4.3.${patch_version}_${STACK_VERSION}-1.zip elastic-${v}_kibana_1:/tmp
		echo docker exec -ti  elastic-${v}_kibana_1  /usr/share/kibana/bin/kibana-plugin install file:///tmp/wazuh_kibana-4.3.${patch_version}_${STACK_VERSION}-1.zip
		echo docker restart elastic-${v}_kibana_1
		echo docker cp ./config/kibana/wazuh.yml elastic-${v}_kibana_1:/usr/share/kibana/data/wazuh/config/
		;;
	down)
		# delete volumes
		docker-compose -f pre.yml down -v --remove-orphans
		;;
	*)
		usage
		;;
esac
