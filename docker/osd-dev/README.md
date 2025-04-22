# Wazuh development with Wazuh Stack

## Requirements

- vm.max_map_count=262144

  To modify the vm.max_map_count:

    **Linux:**
  `sudo sysctl -w vm.max_map_count=262144`
  
    **MacOs:**  
  For Docker Desktop on Mac, this setting needs to be applied to the Linux VM that runs Docker

  `docker run --rm --privileged alpine sysctl -w vm.max_map_count=262144`
  This command temporarily increases the memory map count limit in the Docker VM, which is required for Elasticsearch/OpenSearch to function properly. The setting will persist until Docker Desktop is restarted.
  
- jq

  To install jq, you can run this command:

  - In Debian/Ubuntu os:
    `sudo apt-get install jq`
  - In RedHat/CentOS:
    `sudo yum install jq`
  - In Arch:
    `sudo pacman -Sy --noconfirm jq`
  - In MAC:
    `brew install jq in MAC OS`

## Usage

Use always the provided script to bring up or down the development
environment. For example:

```
./dev.sh [-os <os_version>] [-osd <osd_version>] [--wz-home <wazuh_app_source>] [-saml] [--server <server_version>] [--no-start] -a, --action <action>
```

use `--help` for more info.

The script will ask you all the required parameters to bring up the
environment, including the version of the elastic stack you want to
develop for, and the source code folder where the `wazuh-dashboard-plugins` is
located.

Use the `saml` flag to bring up KeyCloak IDP. **Add idp to your hosts and start
the server using the `--no-base-path`**.

Use the `--no-start` flag if you want to prevent the automatic startup of the dashboard service. This keeps the container running without starting the service, allowing you to connect to it and run commands manually:

``bash
  For example:
  ### Start the environment without automatically starting the dashboard service
  ./dev.sh -os 2.19.1 -osd 2.19.1-5.0.0 --no-start -a up

  ### Then connect to the container
  docker exec -it os-dev-2191-osd-1 bash

  ### Manually install dependencies
  cd /kbn/plugins/wazuh-core
  yarn installl

  ### And manually start the service
  cd /kbn
  yarn start
```

```apacheconf
# Linux systems: /etc/hosts
# Windows systems: C:\Windows\System32\drivers\etc\hosts
127.0.0.1 idp
```

**The script will not select the appropriate version of the
`wazuh-dashboard-plugins` to use, so be sure to check out the appropriate
version before bringing up the environment!**

### UI Credentials

The default user and password to access the UI at https://0.0.0.0:5601/ are:

```
admin:admin
```

## Notes

`Wazuh Indexer` and `Wazuh Dashboard` are both a redistribution of a
version of the OpenSearch Stack. We will only create environments for
the versions of OpenSearch which will be included into a Wazuh
version.

We must use official `Wazuh Indexer` and `Wazuh Dashboard` images for
testing!

This environment will start a working deployment with:

- Imposter - a mock server.
- Elasticsearch-exporter - Elasticsearch metrics to Prometheus adapter.
- OpenSearch single-node cluster.
- OpenSearch Dashboards development environment.

The OpenSearch Dashboards development environment includes an already
bootstrapped Kibana, with all the node modules precompiled and ready to
use in a development session.
