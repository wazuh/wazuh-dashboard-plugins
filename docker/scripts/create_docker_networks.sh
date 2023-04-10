#!/bin/bash

networks=('mon' 'devel')

# Function to check if the Docker network exists in the host. If not, creates it.
# Arguments:
#   $1: Docker network name
# Usage:
#   check_and_create_network <network_name>
check_and_create_network() {
    if [ -z "$(docker network ls | grep $1)" ]; then
        docker network create $1
    fi
}

for network in ${networks[@]}; do
    check_and_create_network ${network}
done