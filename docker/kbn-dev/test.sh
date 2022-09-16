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
	'8.0.0'
	'8.1.0'
	'8.2.1'
	'8.2.3'
	'8.3.0'
	'8.3.1'
)


for version in "${elastic_versions[@]}"
do
    docker inspect --type=image quay.io/wazuh/kbn-dev:"$version" >/dev/null 2>&1 && echo yes || echo no
done