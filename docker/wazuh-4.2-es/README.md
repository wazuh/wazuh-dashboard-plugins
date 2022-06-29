# Wazuh in Elastic Stack

On this folder we can find two types of environments:

 * release environment, managed by the `rel.sh` script
 * prerelease environment managed by the `pre.sh` script


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

The version lists are defined in the `pro.sh` script. Edit it to add new
supported versions.

 ### Install a compatible wazuh

When the `pro.sh` script ends, it will print the commands how to install the
Wazuh application to run within Kibana:

For example, the command

```bash
`./rel.sh 7.14.2 4.2.6 up`
````

Will print:

```bash
Install Wazuh 4.2.6 into Elastic 7.14.2 manually with:

docker exec -ti elastic-7142_kibana_1 /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/4.x/ui/kibana/wazuh_kibana-4.2.6_7.14.2-1.zip
docker restart elastic-7142_kibana_1
docker cp ./config/kibana/wazuh.yml elastic-7142_kibana_1:/usr/share/kibana/data/wazuh/config/
```

This is a manual procedure which might be automated in the future. But any 
automatism will need:

1. Wait for Kibana to be ready.

2. Execute the Wazuh plugin installation command:

```bash
docker exec -ti elastic-7142_kibana_1 /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/4.x/ui/kibana/wazuh_kibana-4.2.6_7.14.2-1.zip
```

3. Restart the Kibana container to activate Wazuh:

```bash
docker restart elastic-7142_kibana_1
```

4. Wait for Kibana to be ready.
5. Copy the configuration file to Kibana so Wazuh is set up correctly:

```bash
docker cp ./config/kibana/wazuh.yml elastic-7142_kibana_1:/usr/share/kibana/data/wazuh/config/
```

If this command returns a `no such file or directory` message, means Kibana is 
still initializing the plugin, try again a couple of seconds later,depending on 
your computer.

## Multi-node cluster

The `pro.yml` file contains a docker-compose with all the set up for a 3 node 
cluster, read it carefully if you need to bring such a cluster.

## Agent registrations

To register an agent, we need to get the registering command from the UI and run 
commands like the ones below. Please pay atention to the Wazuh version in the network name.

These images will run in the background and a `docker logs` command will show 
the agent ossec.log file.

For `centOS/8` images:
```bash
docker run --rm --network es-rel-4.2.6 -d centos:8 bash -c '
    sed -i -e "s|mirrorlist=|#mirrorlist=|g" /etc/yum.repos.d/CentOS-*
    sed -i -e "s|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g" /etc/yum.repos.d/CentOS-*

    # Change this command by the one the UI suggest to use add it the -y and remove the sudo
    WAZUH_MANAGER='wazuh.manager' yum install -y https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-4.2.6-1.el5.x86_64.rpm

    /etc/init.d/wazuh-agent start
    tail -f /var/ossec/logs/ossec.log
'
```
For `Ubuntu` images
```bash
docker run --network es-rel-4.2.6 -d ubuntu:20.04 bash -c '
    apt update -y
    apt install -y curl lsb-release
    # Change this command by the one the UI suggest to use add it tremove the sudo
    curl -so wazuh-agent-4.2.6.deb https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.3.4-1_amd64.deb && WAZUH_MANAGER='wazuh.manager' dpkg -i ./wazuh-agent-4.2.6.deb

    /etc/init.d/wazuh-agent start
    tail -f /var/ossec/logs/ossec.log
'
``` 
For `non-Linux` agents we would need to provision virtual machines.


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
  elastic_version is one of  7.16.0 7.16.1 7.16.2 7.14.2 7.17.0 7.17.1 7.17.2 7.17.3 7.17.4
  wazuh_api_version is the minor version of wazuh 4.3, for example
  action is one of up | down

In a minor release, the API should not change the version here bumps the API
 string returned for testing. This script generates the file

    config/imposter/api_info.json

used by the mock server
```

Please take into account that the API version for this environment will always 
be a 4.3.X version. Also consider that our application version must be the same 
as the one selected here.

### Install a compatible wazuh

The same approach used by the production environment is used in the pre-release 
package.

### Agent registrations

Because we're not using a real wazuh-manager, we cannot registrate new agents, 
but the mock server wil generate data to valid API requests as if it were the 
real Wazuh server.
