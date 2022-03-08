## What is this?

This directory contains files to create development and production environments to use Wazuh.

### Requirements
- docker
- docker-compose

### Folders
This directory is divided in:
- `config`: shared configuration files
  - `filebeat`: configuration for Filebeat (Elasticsearch basic, X-Pack and ODFE)
  - `kibana`: configuration for Kibana (Elasticsearch basic, X-Pack and ODFE)
  - `splunk`: configuration for Splunk
- `images`: Docker images for Wazuh managers (from packages and sources), agents (from packages and sources), Kibana from packages (basic, X-Pack and ODFE)
- `templates_elastic_dev`: environments with Wazuh manager/s, agent and Elasticsearch (basic, X-Pack and ODFE)
- `templates_elastic_prod`: environments with Wazuh manager/s, agent and Elasticsearch (basic, X-Pack and ODFE) and Kibana
- `templates_splunk_def`: environments with Wazuh manager/s, agent and Splunk
- `custom`: create the particular environments you need without modify the templates
- `scripts`: util scripts to use with the environments

## Firt steps

Give permission to all files:

`chmod -R 777 docker-environments`

## How to use: workflow

The proposed workflow is:
1. Copy some template defined in the `templates_` directories to `custom` folder to create the specific environment you need.
2. Replace the variables in the `.env` file. You could require some ajustments in the `docker-compose.yml` file.
  > Some templates can have some requirements to work. Read the `README.md` for more information.
3. Up the environment with `docker-compose up -d`

## Templates folders name convention:

The folders for the environments templates are defined with the next structure:
`<STORAGE_SYSTEM>-<WAZUH MANAGER>-<WAZUH-AGENT>`

Note: `STORAGE_SYSTEM` can be `Elasticsearch` or `Splunk`

Elasticsearch:
- `es_basic`: Elasticsearch without security
- `es_xpack`: Elasticsearch with X-Pack
- `es_odfe`: Elasticsearch with Open Distro for Elasticsearch (ODFE)

Splunk
- `splunk`: Splunk UI with indexer

Wazuh manager:
- `wz_manager`: 1 Wazuh manager in manager mode (cluster disabled)
- `wz_cluster`: 2 Wazuh managers: 1 master and 1 worker (cluster enabled)

Wazuh agent:
- `agent`: 1 agent

For example:

Environment template folder name: `es_basic-wz_cluster-agent`
Content:
 - `es_basic`: Elasticsearch basic (without security)
 - `wz_cluster`: 2 Wazuh managers in cluster mode. 1 master and 1 worker
 - `agent`: 1 Wazuh agent

### Images
#### Wazuh managers from sources
Depending on the required Wazuh version, use the correct image:
- 3.x: `wazuh_manager_filebeat_sources_3.x`
- 4.0-4.1: `wazuh_manager_filebeat_sources`
- 4.2: `wazuh_manager_filebeat_sources_cmake`

## Install Wazuh app:
Install the Wazuh application in the Kibana container (cluster). Having any of the following containers running:
- templates_elastic_prod/es_basic-wz_cluster-agent
- templates_elastic_prod/es_odfe-wz_cluster-agent
- templates_elastic_prod/es_xpack-wz_cluster-agent

Run the command `install_wz_plugin.sh`

Options: 
- `$1` Type of installation:`basic` `odfe` `xpack`
- `$2` Package name into 'packages' folder, for example: `wazuh_kibana-4.1.5_7.10.2-1.zip`
- `$3` Absolute path to the `docker-compose.yml` file

For example: 
```
sh install_wz_plugin.sh basic wazuh_kibana-4.1.5_7.10.2-1.zip /Users/xxx/wazuh-app-environments/templates_elastic_prod/es_basic-wz_cluster-agent/docker-compose.yml
```

Uninstall example: 
```
docker exec es_basic-wz_cluster-agent_kibana_1 bin/kibana-plugin remove wazuh
```

## Known bugs and fixes

## Bug: `The elasticsearch container is down`

In the container logs `docker-compose logs elasticsearch` you can find the following error.
> `ERROR: bootstrap checks failed max virtual memory areas vm.max_map_count [65530] likely too low, increase to at least [262144]`.

You may not find the error above, the container is just up for a few seconds and then it falls.

### Solution for linux:
Run the following command

```
sudo sysctl -w vm.max_map_count=262144
```

The problem is that whenever you restart the machine you will have to run that command again, so that the solution persists, you will have to modify the `/etc/sysctl.conf` file as follows:
```
sudo nano /etc/sysctl.conf 
# Add this line to the end
vm.max_map_count=262144
```

### Solution for Windows:
Run the following command in `Powershell`
```
wsl -d docker-desktop
sysctl -w vm.max_map_count=262144
```

You will also have to do this every time you restart the machine (there should be a solution similar to linux, I don't know it) for more info [see here](https://github.com/docker/for-win/issues/5202)

### Solution for macOS:
In my case, executing the command `sudo sysctl -w vm.max_map_count = 262144` and editing the following file did NOT work for me.
```
sudo nano /etc/sysctl.conf 
# Add this line to the end
vm.max_map_count=262144
```
Therefore I went to the docker app and in the preferences increase the memory (I went from 2GB to 3GB) see attached image
[For more info about mac consult here](https://stackoverflow.com/questions/41192680/update-max-map-count-for-elasticsearch-docker-container-mac-host)

![docker](/public/assets/docker-macos.png)

## Bug: `I can't run any environment on Mac with Apple Chip M1`
### Solution:

All the images created in this repository work perfectly on processors with x86 and x64 architecture

Mac's M1 chip has a type of ARM architecture which completely changes the way it works.

Recently docker released its version with native support for this architecture. But not all images in the docker hub are natively compatible with this architecture. (for example the image of opendistro `amazon/opendistro-for-elasticsearch`, for the `es_odfe` templates)

Currently the way in which the `agent` and the `manager` is built is based on the x64 architecture, the solution I found to build the images with that architecture is forcing you to download the linux base image based on amd64.

for example:

In the file `Dockerfile` of template `wazuh_manager_filebeat_sources_cmake` 

Modify
```
FROM ubuntu:18.04
```
by
```
FROM amd64/ubuntu:18.04
```

We do the same for any template that we are going to use (with the agent and manager images), currently this solution works for the `basic` and `xpack` templates, with `odfe` I can't find a solution.

After editing this value, we can run the environments in the way we are used to.

Note: Install Docker as mentioned in its official documentation [Docker Desktop](https://www.docker.com/products/docker-desktop)