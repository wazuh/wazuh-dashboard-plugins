#!/usr/bin/env bash

odfe_versions=(
	"1.13.2"
)

wazuh_versions=(
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
	echo "$0 elastic_version wazuh_manager_version action [saml]"
	echo
	echo "where"
	echo "  elastic_version is one of " ${odfe_versions[*]}
	echo "  wazuh_manager_version if one of " ${wazuh_versions[*]}
	echo "  action is one of up | down | stop"
	echo "optionally add 'saml' as the last parameter to deploy a saml enabled environment"
	exit -1
}

if [ $# -lt	3 ]
  then
  	echo "Incorrect number of arguments " $#
    usage
fi

if [[ ! " ${odfe_versions[*]} " =~ " ${1} " ]]
 then
 	echo "Version ${1} not found in ${odfe_versions[*]}"
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
export COMPOSE_PROJECT_NAME=odfe-rel-$ES_VERSION
export KIBANA_CONF=./config/kibana/kibana.yml
profile="standard"
if [[ "$4" =~ "saml" ]]
then
	profile="saml"
	export KIBANA_CONF=./config/kibana/kibana_saml.yml
fi

case "$3" in
	up)
		v=$(echo -n $COMPOSE_PROJECT_NAME | sed 's/\.//g' )
		docker compose --profile $profile -f rel.yml up -Vd
		if [[ "${profile}" =~ "saml" ]]
		then
			./enable_saml.sh ${v}
		fi

		# This installs Wazuh and integrates with a default elastic stack
		echo
		echo Install Wazuh ${WAZUH_VERSION} into Elastic ${ES_VERSION} manually with:
		echo
		echo 1. Install wazuh kibana app
		echo docker exec -ti  ${v}-kibana-1  /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/4.x/ui/kibana/wazuh_kibana-${WAZUH_VERSION}_7.10.2-1.zip
		echo 2. Restart Kibana
		echo docker restart ${v}-kibana-1
		echo 3. Configure kibana
		echo docker cp ./config/kibana/wazuh.yml ${v}-kibana-1:/usr/share/kibana/data/wazuh/config/
		;;
	down)
		docker compose --profile $profile -f rel.yml down -v --remove-orphans
		;;
	stop)
		docker compose --profile $profile -f rel.yml stop
		;;
	*)
		usage
		;;
esac
