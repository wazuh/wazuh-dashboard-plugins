# Wazuh in Elastic Stack

On this folder we can find two types of environments:

 * release environment, managed by the `rel.sh` script
 * prerelease environment managed by the `pre.sh` script

###  UI Credentials

The default user and password to access the UI at https://0.0.0.0:5601/ are:

```
elastic:SecretPassword
```

## Multi-node cluster

The `rel.yml` and `pre.yml` files contain a docker-compose with all the set 
up for a 3 node cluster, read it carefully if you need to bring such a cluster.

## Release environment

This environment brings up a complete Elastic environment with:
 - Elasticsearch cluster with a single node
 - Elasticsearch Kibana with a single node
 - Elasticsearch exporter
 - Wazuh manager

The environment expect the network `mon` to exists, either bring up the
`mon` stack or execute the following command:

```bash
docker network create mon
```

This needs to be done just once.

### Usage:

```bash
./rel.sh elastic_version wazuh_manager_version action 

where
  elastic_version is one of  7.14.2 7.14.1 7.14.0 7.13.4 7.13.3 7.13.2 7.13.1 7.13.0 7.12.1 7.11.2 7.10.2
  wazuh_manager_version if one of  4.2.7 4.2.6 4.2.5 4.2.4 4.2.3 4.2.2 4.2.1 4.2.0
  action is one of up | down | stop
```

The version lists are defined in the `rel.sh` script. Edit it to add new
supported versions.

### Install a compatible Wazuh app

When the `rel.sh` script ends, it will print the commands to install the
Wazuh app in Kibana:

For example, the command

```bash
`./rel.sh 7.14.2 4.2.6 up`
```

Will print:

```bash
Install Wazuh 4.2.6 into Elastic 7.14.2 manually with:

1. Install the Wazuh app for Kibana
docker exec -ti es-rel-7142-kibana-1 /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/4.x/ui/kibana/wazuh_kibana-4.2.6_7.14.2-1.zip

2. Restart Kibana
docker restart es-rel-7142-kibana-1

3. Configure Kibana
docker cp ./config/kibana/wazuh.yml es-rel-7142-kibana-1:/usr/share/kibana/data/wazuh/config/

4. Open Kibana in a browser:
http://localhost:5601
```

This is a manual procedure which might be automated in the future. Any 
automatism will need:

1. Wait for Kibana to be ready.

2. Execute the Wazuh plugin installation command:

```bash
docker exec -ti es-rel-7142-kibana-1 /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/4.x/ui/kibana/wazuh_kibana-4.2.6_7.14.2-1.zip
```

3. Restart the Kibana container to enable Wazuh:

```bash
docker restart es-rel-7142-kibana-1
```

4. Wait for Kibana to be ready.
5. Copy the configuration file to Kibana so Wazuh is set up correctly:

```bash
docker cp ./config/kibana/wazuh.yml es-rel-7142-kibana-1:/usr/share/kibana/data/wazuh/config/
```

If this command returns a `no such file or directory` message, means Kibana is 
still initializing the plugin, try again a couple of seconds later, depending on 
your computer.

## Registering agents using Docker

To register an agent, we need to get the registering command from the UI and 
run commands like the ones below. Please pay atention to the Wazuh version in 
the network name.

These images will run in the background and a `docker logs` command will show 
the agent `ossec.log` file.

- For `CentOS/8` images:
  ```bash
  docker run --rm --name es-rel-7142-wazuh.agent --network es-rel-7142 --label com.docker.compose.project=es-rel-7142 -d centos:8 bash -c '
    sed -i -e "s|mirrorlist=|#mirrorlist=|g" /etc/yum.repos.d/CentOS-*
    sed -i -e "s|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g" /etc/yum.repos.d/CentOS-*

    # Change this command by the one the UI suggest to use add it the -y and remove the sudo
    WAZUH_MANAGER='wazuh.manager' yum install -y https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-4.2.6-1.el5.x86_64.rpm

    /etc/init.d/wazuh-agent start
    tail -f /var/ossec/logs/ossec.log
  '
  ```

- For `Ubuntu` images:
  ```bash
  docker run --name es-rel-7142-wazuh.agent --network es-rel-7142 --label com.docker.compose.project=es-rel-7142 -d ubuntu:20.04 bash -c '
    apt update -y
    apt install -y curl lsb-release
    curl -so \wazuh-agent-4.2.6.deb \
      https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.2.6-1_amd64.deb \
      && WAZUH_MANAGER='wazuh.manager' WAZUH_AGENT_GROUP='default' dpkg -i ./wazuh-agent-4.2.6.deb

    /etc/init.d/wazuh-agent start
    tail -f /var/ossec/logs/ossec.log
  '
  ```
 
- For `non-Linux` agents:
  
  We need to provision virtual machines.

## Prerelease environment

The prerelease environment help us test app releases while the rest of
Wazuh packages haven't been generated yet.

This environment will bring up:

 - Elasticsearch cluster with a single node
 - Elasticsearch Kibana with a single node
 - Elasticsearch exporter
 - Filebeat
 - Imposter

### Usage

```bash
./pre.sh elastic_version wazuh_api_version action 

where
  elastic_version is one of  7.14.2 7.14.1 7.14.0 7.13.4 7.13.3 7.13.2 7.13.1 7.13.0 7.12.1 7.11.2 7.10.2
  wazuh_api_version is the patch version of wazuh 4.2, for example  3 7
  action is one of up | down | stop

In a minor release, the API should not change the version here bumps the API
 string returned for testing. This script generates the file 

    config/imposter/api_info.json

used by the mock server
```

Please take into account that the API version for this environment will always 
be a 4.3.X version. Also consider that our application version must be the same 
as the one selected here.

### Install a compatible Wazuh app

Follow the instructions provided by the `pre.sh` script. 

### Agent enrollment

Because we're not using a real Wazuh Manager, we cannot register new agents. 
Instead, Imposter (the mock server) will provide mocked responds to valid API 
requests, as if it were the real Wazuh server.
