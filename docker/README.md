# Frontend development environment

Install [Docker Desktop](https://docs.docker.com/get-docker/) as per its instructions.
It works for Linux too. 

## Pre-requisites

 1. Create the `devel` network:

	```bash
	docker network create devel
	```

 2. Create the `mon` network:

	```bash
	docker network create mon
	```

 3. Install the Grafana Loki, used to read logs from the containers:

	```bash
	docker plugin install grafana/loki-docker-driver:latest --alias loki --grant-all-permissions
	```

## Building images

 1. Start the npm cache server:

	```bash
	cd cache
	docker-compose up -d
	cd ..
	```

 2. Build all images, or the one you require

	```bash
	cd images
	docker build -t quay.io/wazuh/image-name:version -f image-name-version.Dockerfile .
	cd ..
	```

 3. Uploading images to [quay.io](quay.io)

	```bash
 	docker login quay.io
 	docker push quay.io/wazuh/image-name:version
	```

## Environments

### **mon** - monitoring environment


Folder: [mon/](./mon/)

This will bring up a [Grafana](https://grafana.com/) stack to collect logs and 
metrics from the containers. Also this will create the `mon` network, which will 
be needed by the other environments.

### **osd-dev** - OpenSearch Dashboards development environment

Folder: [osd-dev](./osd-dev/)

This will bring up a development environment for Wazuh using the 
opensearch-dashboards version included in Wazuh. 

### **knb-dev** - Kibana 7.X & Kibana 8.X development environment

Folder: [kbn-dev](./kbn-dev/)

This will bring up a development environment for Wazuh using the Kibana 
development container versions of the 7 series and 8 series.

<!-- ### kbn-8

### Wazuh Stack 4.2.X

### Wazuh Stack 4.1.X

### Wazuh Stack 4.0.X

### Wazuh Stack 3.13.X
 -->
