# Frontend development environment

Install docker desktop as per its instructions. It works in linux too. 

Create the devel network:

$ docker network create devel

# Building images

 1. Start the npm cache server:

	$ cd cache
	$ docker-compose up -d
	$ cd ..

 2. Build all images, or the one you require

	$ cd images
	$ docker build -t quay.io/wazuh/image-name:version -f image-name-version.Dockerfile .
	$ cd ..

 3. Uploading images to quay.io

 	$ docker login quay.io
 	$ docker push quay.io/wazuh/image-name:version

# Environments

## mon - monitoring environment


Folder: mon/

This will bring up a grafana stack to collect logs and metrics from the containers. Also this will create the `mon` network, which will be needed by the other environments.



## osd-1 - opensearch dashboard development environment

Folder: osd-X

This will bring up a development environment for wazuh using the opensearch-dashboard version included in wazuh. 

## knb-7 - kibana 7.X dashboard development environment

Folder: kbn-7

This will bring up a development environment for wazuh using the Kibana development container versions of the 7 series.



## kbn-8

## Wazuh Stack 4.2.X

## Wazuh Stack 4.1.X

## Wazuh Stack 4.0.X

## Wazuh Stack 3.13.X






