# Frontend development environment

Install [Docker Desktop](https://docs.docker.com/get-docker/) as per
its instructions. It works for Linux too. This ensures the development
experience between linux, mac and windows is as similar as posible.

In general the environment consist of:

- lightweight monitoring stack based on grafana, loki and prometheus
- dockerized development environments
- releases and pre-releases docker images for testing

# Pre-requisites

## Logging

Docker can write the container logs into a Grafana Loki instance using
the apropriate driver.

The environments are designed to use this driver, to work with them,
install the driver with the command:

	```bash
	docker plugin install grafana/loki-docker-driver:latest --alias loki --grant-all-permissions
	```

## Images

We use official docker images whenever possible. To develop our
applications we have generated docker images to develop applications
for kibana and opensearch dashboards.

These images can be downloaded from the quay.io/wazuh registry.

If you want to build an image, we recommend to use a npm cache server
so the download of node modules from the network only happens once
while developing the image.


 To start the npm cache server:

	```bash
	cd cache
	docker-compose up -d
	cd ..
	```

To build an image, use the docker build command like:

	```bash
	cd images
	docker build -t quay.io/wazuh/image-name:version -f image-name-version.Dockerfile .
	cd ..
	```

If you're creating a new image, copy one of the ones already present
in the directory, and adapt it to the new version.

 To upload images to [quay.io](quay.io)

	```bash
 	docker login quay.io
 	docker push quay.io/wazuh/image-name:version
	```

## Environments

### **mon** - monitoring environment

Folder: [mon/](./mon/)

This will bring up a [Grafana](https://grafana.com/) stack to collect
logs and metrics from the containers. Also this will create the `mon`
network, which will be needed by the other environments.


If you don´t want to bring up this environment, be sure to create the
`mon` network as it is required by other docker-compose and scripts.


### **osd-dev** - OpenSearch Dashboards development environment

Folder: [osd-dev](./osd-dev/)

This will bring up a development environment for Wazuh using the
opensearch-dashboards version included in Wazuh.

### **knb-dev** - Kibana 7.X & Kibana 8.X development environment

Folder: [kbn-dev](./kbn-dev/)

This will bring up a development environment for Wazuh using the Kibana
development container versions of the 7 series and 8 series.

### Wazuh 4.3.X testing environment with Elastic Stack

Folder: [wazuh-4.3-es](./wazuh-4.3-es)

Within this folder there are two scripts:

 - `pro.sh` brings up released versions
 - `pre.sh` brings up unreleased versions

### Wazuh 4.3.X testing environment with wazuh-dashboard and wazuh-indexer

Folder: [wazuh-4.3-wz](./wazuh-4.3-wz)

Within this folder there are two scripts:

 - `pro.sh` brings up released versions
 - `pre.sh` brings up unreleased versions

### Wazuh 4.2.X testing environment with Elastic Stack

Folder: [wazuh-4.2-es](./wazuh-4.2-es)

### Wazuh 4.2.X testing environment with OpenDistro

Folder: [wazuh-4.2-od](./wazuh-4.2-od)

### Wazuh 3.13.X testing environment with Elastic Stack

Folder: [wazuh-3.13.X-es](./wazuh-3.13.X-es)

### Wazuh 3.13.X testing environment with OpenDistro

Folder: [wazuh-3.13.X-od](./wazuh-3.13.X-od)

