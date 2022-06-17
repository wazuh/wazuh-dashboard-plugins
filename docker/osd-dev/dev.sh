#!/bin/bash

if [ -z "${SRC}" ]; then 
	echo "Usage:"
	echo " ./dev.sh up | down"
	exit
fi


# Password for the 'kibana_system' user (at least 6 characters)
export KIBANA_PASSWORD=SecretPassword

# Port to expose Kibana to the host
export KIBANA_PORT=5601

case "$1" in
	up)
		docker-compose -f dev.yml up -Vd
		;;
	down)
		docker-compose -f dev.yml down -v
		;;
	*)
		echo "Usage:"
		echo "SRC=~/src/wazuh-kibana-app WAZUH_VERSION=4.3.4 ./dev.sh up | down"
		;;
esac
