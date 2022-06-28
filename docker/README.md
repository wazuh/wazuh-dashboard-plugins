# Frontend development environment

Install [Docker Desktop][0] as perits instructions. It works for Linux too. 
This ensures the developmentexperience between Linux, Mac and Windows is as 
similar as posible.

In general the environment consist of:

- lightweight monitoring stack based on [Grafana][1], [Loki][2] and [Prometheus][3].
- dockerized development environments.
- releases and pre-releases docker images for testing.

# Pre-requisites

 1. Create the `devel` network:

	```bash
	docker network create devel
	```

 2. Create the `mon` network:

	```bash
	docker network create mon
	```

 3. Install the Docker driver Loki, from [Grafana][1], used to read logs from the containers:

	```bash
	docker plugin install grafana/loki-docker-driver:latest --alias loki --grant-all-permissions
	```
 4. Assign resources to [Docker Desktop][0]. The requirements for the environments are:
	- 4 GB of RAM (minimum)
	- Half of your system RAM (recommended)
	

## Starting up the environments

Choose one of the [environments](#environments) available and use the `sh` script
to up the environment. The script takes 3 arguments and provide help for each of
them if wrong arguments were given.

Example:

This brings up a Dev environment for Kibana 7.17.4:
```bash
./dev.sh 7.17.4 $WZ_HOME up
```

`$WZ_HOME` is the path to your local Wazuh Kibana App source code. You can save
this path as an environment variable on your system.

Once the containers are up, attach a shell to the Kibana container, move to 
the `kbn\plugins\wazuh` and run `yarn` to install the dependencies of the project.
After that, move back to the root folder of the platform and run `yarn start` to
start the App.

The dependencies of the platform (Kibana \ OSD) are already installed.

### Wrong user permissions

During the installation of the dependencies, you will most likely see an error
related to the lack of write permissions on the Docker volume `plugins/wazuh`.
To solve this, create a new group named `docker-desktop` with the GUID 100999,
and then add your user and the source code folder to this group:

```bash
sudo groupadd -g 100999 docker-desktop
sudo useradd -u 100999 -g 100999 -M docker-desktop
sudo chown -R $(whoami):docker-desktop ~/your/path/to/wazuh_kibana_app
sudo usermod -aG docker-desktop $(whoami)
```

After this. you can install the dependencies and start the project as usual.

## Logging

Docker can write the container logs into a [Grafana Loki][2] instance using
the apropriate driver.

The environments are designed to use this driver, to work with them,
install the driver as described on the step 3 of [Pre-reqiusites](#pre-requisites).

## Images

We use official Docker images whenever possible. To develop our
applications we have generated Docker images to develop applications
for Kibana and OpenSearch Dashboards.

These images can be downloaded from the [quay.io/wazuh][4] registry.

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


[0]: <https://docs.docker.com/get-docker/> "Docker Desktop"
[1]: <https://grafana.com/> "Grafana"
[2]: <https://grafana.com/oss/loki/> "Loki"
[3]: <https://prometheus.io/docs/visualization/grafana/> "Prometheus"
[4]: <https://quay.io/organization/wazuh> "quay.io/wazuh"