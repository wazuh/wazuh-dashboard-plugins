# Wazuh in Elastic Stack

On this folder we can find to types of environments:

 * release environment, managed by the `rel.sh` script
 * prerelease environment managed by the `pre.sh` script


## Release environment

This environment brings up a complete elastic environment with:
 - Elasticsearch cluster with a single node
 - Elasticsearch Kibana with a single node
 - Elasticsearch exporter
 - Wazuh manager

The environment expect the network mon to exists, either bring up the
mon stack or execute the following command:

    $ docker network create mon

This needs to be done just once.

### Usage:

```
./rel.sh elastic_version wazuh_manager_version action

where
  elastic_version is one of  7.16.0 7.16.1 7.16.2 7.16.3 7.17.0 7.17.1 7.17.2 7.17.3 7.17.4
  wazuh_manager_version if one of  4.3.0 4.3.1 4.3.2 4.3.3 4.3.4
  action is one of up | down
```

The version lists are defined in the pro.sh script. Edit it to add new
supported versions.

 ### Install a compatible wazuh

When the `pro.sh` script ends, it will print the commands how to install the
Wazuh application to run within Kibana:

For example, the command

`./rel.sh 7.16.3 4.3.4 up`

Will print:

```
Install Wazuh 4.3.4 into Elastic 7.16.3 manually with:

docker exec -ti elastic-7163_kibana_1 /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/4.x/ui/kibana/wazuh_kibana-4.3.4_7.16.3-1.zip
docker restart elastic-7163_kibana_1
docker cp ./config/kibana/wazuh.yml elastic-7163_kibana_1:/usr/share/kibana/data/wazuh/config/
```

This is a manual procedure which might be automated in the future. But any automatism will need

1. Wait for kibana to be ready

2. Execute the wazuh plugin installation command

`docker exec -ti elastic-7163_kibana_1 /usr/share/kibana/bin/kibana-plugin install https://packages.wazuh.com/4.x/ui/kibana/wazuh_kibana-4.3.4_7.16.3-1.zip`

3. Restart the kibana container to activate Wazuh

`docker restart elastic-7163_kibana_1`

4. Wait for kibana to be ready
5. Copy the configuration file to kibana so wazuh is set up correctly

`docker cp ./config/kibana/wazuh.yml elastic-7163_kibana_1:/usr/share/kibana/data/wazuh/config/`

If this command returns a `no such file or directory` message, means kibana is still initializing the plugin, try again a couple of seconds later ,depending on your computer.

## Multi-node cluster

The `pro.yml` file contains a docker-compose with all the set up for a 3 node cluster, read it carefully if you need to bring such a cluster.

## Agent registrations

To register an agent, we need to get the registering command from the UI and run commands like the ones below. Please pay atention to the Wazuh version in the network name.

These images will run in the background and a `docker logs` command will show the agent ossec.log file.

For centos/8 images:

    $ docker run --rm --network es-rel-4.3.4 -d centos:8 bash -c '
        sed -i -e "s|mirrorlist=|#mirrorlist=|g" /etc/yum.repos.d/CentOS-*
        sed -i -e "s|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g" /etc/yum.repos.d/CentOS-*

        # Change this command by the one the UI suggest to use add it the -y and remove the sudo
        WAZUH_MANAGER='wazuh.manager' yum install -y https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-4.3.4-1.el5.x86_64.rpm

        /etc/init.d/wazuh-agent start
        tail -f /var/ossec/logs/ossec.log
    '

For ubuntu images

    $ docker run --network es-rel-4.3.4 -d ubuntu:20.04 bash -c '
        apt update -y
        apt install -y curl lsb-release
        # Change this command by the one the UI suggest to use add it tremove the sudo
        curl -so wazuh-agent-4.3.4.deb https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.3.4-1_amd64.deb && WAZUH_MANAGER='wazuh.manager' dpkg -i ./wazuh-agent-4.3.4.deb

        /etc/init.d/wazuh-agent start
        tail -f /var/ossec/logs/ossec.log
    '

For non linux agents we would need to provision virtual machines.


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

```
./pre.sh elastic_version wazuh_api_version action

where
  elastic_version is one of  7.16.0 7.16.1 7.16.2 7.16.3 7.17.0 7.17.1 7.17.2 7.17.3 7.17.4
  wazuh_api_version is the minor version of wazuh 4.3, for example
  action is one of up | down

In a minor release, the API should not change the version here bumps the API
 string returned for testing. This script generates the file

    config/imposter/api_info.json

used by the mock server
```

Please take into account that the api version for this environment will always be a 4.3.X version. Also consider that our application version must be the same as the one selected here.

### Install a compatible wazuh

The same approach used by the production environment is used in the pre-release package.

### Agent registrations

Because we're not using a real wazuh-manager, we cannot registrate new agents, but the mock server wil generate data to valid API requests as i it were the real wazuh server.

